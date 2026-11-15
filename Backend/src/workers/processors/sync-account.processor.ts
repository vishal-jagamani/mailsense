import { Job } from 'bullmq';

import { LOGGER_MODULE } from '@constants';
import { NotFoundError, SyncError } from '@errors';
import { EmailProviderFactory, IEmailProvider, SyncResult } from '@integrations/email/index.js';
import { ACCOUNT_PROVIDER, SyncJobResult, SYSTEM_EVENT } from '@mailsense/types';
import { AccountDocument, AccountRepository } from '@modules/accounts/database/index.js';
import { EmailInput, EmailRepository } from '@modules/emails/database/index.js';
import { FolderService } from '@modules/folders/services/index.js';
import { monitoring } from '@monitoring';
import { createLogger, setTraceContext } from '@observability';
import { RefreshTokenPayload, SyncAccountPayload } from '@queue';
import { ErrorWithStatus, SuccessStatusResponse } from '@types';
import { eventBus } from '../../core/events/index.js';
import { refreshTokenProcessor } from './refresh-token.processor.js';

const logger = createLogger(LOGGER_MODULE.SYNC_ACCOUNT_PROCESSOR);

function hasTokenExpiryMessage(message?: string): boolean {
    if (!message) return false;
    const lower = message.toLowerCase();
    return lower.includes('unauthorized') || lower.includes('expired') || lower.includes('invalid credentials');
}

function hasUnauthorizedStatus(err: ErrorWithStatus): boolean {
    if (err.status === 401 || err.statusCode === 401) return true;
    return Boolean(err.response && (err.response.status === 401 || err.response.statusCode === 401));
}

function isTokenExpiryError(error: Error | ErrorWithStatus | null | undefined): boolean {
    if (!error) return false;
    if (error instanceof Error && hasTokenExpiryMessage(error.message)) {
        return true;
    }
    return hasUnauthorizedStatus(error as ErrorWithStatus);
}

function validateAccountForSync(account: AccountDocument, accountId: string): boolean {
    if (!account.active) {
        logger.warn(`⚠️ Sync execution aborted. Account is inactive: ${accountId}`);
        return false;
    }

    if (!account.syncEnabled) {
        logger.warn(`⚠️ Sync execution aborted. Sync is disabled: ${accountId}`);
        return false;
    }
    return true;
}

async function fetchMessagesWithRetry(emailProvider: IEmailProvider, accountId: string, cursor?: string): Promise<SyncResult | null> {
    try {
        return cursor !== undefined ? await emailProvider.fetchMessages(accountId, cursor) : await emailProvider.fetchMessages(accountId);
    } catch (error) {
        if (!isTokenExpiryError(error as Error | ErrorWithStatus)) {
            throw error;
        }

        logger.info(`🔑 Token validation failed for account ${accountId}. Running inline token refresh...`);
        await refreshTokenProcessor({ data: { accountId } } as Job<RefreshTokenPayload, SuccessStatusResponse>);

        const updatedAccount = await AccountRepository.getAccountById(accountId);
        if (!updatedAccount || !updatedAccount.active) {
            throw new SyncError({ accountId, message: `Account disabled or missing post token refresh: ${accountId}` });
        }

        logger.info(`🔑 Retrying fetchMessages for account: ${accountId}`);
        return cursor !== undefined
            ? await emailProvider.fetchMessages(accountId, updatedAccount.lastSyncCursor)
            : await emailProvider.fetchMessages(accountId);
    }
}

async function upsertAccountNewEmailsAndPublishEvent(
    userId: string,
    accountId: string,
    addedEmails: EmailInput[] | Partial<EmailInput>[],
    fullSync: boolean,
): Promise<void> {
    logger.info(`Upserting ${addedEmails.length} ${fullSync ? 'emails after full sync' : 'new/updated emails'} for account: ${accountId}`);
    await EmailRepository.upsertEmailsInBulk(addedEmails);

    // Emit EMAIL_CREATED for each newly indexed message
    for (const email of addedEmails) {
        eventBus.publish(SYSTEM_EVENT.EMAIL_CREATED, {
            accountId,
            email,
        });
    }

    // Extract provider message IDs and resolve MongoDB _id strings
    const providerMessageIds = addedEmails.map((email) => email.providerMessageId).filter((id): id is string => Boolean(id));

    if (providerMessageIds.length > 0) {
        const syncedEmailIds = await EmailRepository.getEmailIdsByProviderMessageIds(providerMessageIds, accountId);

        if (syncedEmailIds && syncedEmailIds.length > 0) {
            eventBus.publish(SYSTEM_EVENT.EMAIL_BATCH_SYNCED, {
                accountId,
                userId,
                emailIds: syncedEmailIds,
                batchSize: syncedEmailIds.length,
                timestamp: Date.now(),
            });
            logger.info(`Published EMAIL_BATCH_SYNCED event for ${syncedEmailIds.length} emails`);
        }
    }
}

async function upsertAccountSyncData(userId: string, accountId: string, syncResult: SyncResult, fullSync: boolean): Promise<SyncJobResult> {
    let addedEmailsCount = 0;
    let deletedEmailsCount = 0;
    const { addedEmails, deletedEmailIds, newCursor } = syncResult;

    if (fullSync) {
        // Delete all previous emails for full sync
        logger.info(`Clearing existing emails for full sync of account: ${accountId}`);
        await EmailRepository.deleteEmailsByAccountId(accountId);
    }

    if (deletedEmailIds && deletedEmailIds.length > 0) {
        logger.info(`Deleting ${deletedEmailIds.length} emails for account: ${accountId}`);
        await EmailRepository.deleteManyEmails(deletedEmailIds);
        deletedEmailsCount = deletedEmailIds.length;
    }

    if (addedEmails && addedEmails.length > 0) {
        addedEmailsCount = addedEmails.length;
        await upsertAccountNewEmailsAndPublishEvent(userId, accountId, addedEmails, fullSync);
    }

    await AccountRepository.updateAccount(accountId, {
        lastSyncedAt: Date.now(),
        lastSyncCursor: newCursor,
    });

    return { addedEmailsCount, deletedEmailsCount };
}

export const syncAccountProcessor = async (job: Job<SyncAccountPayload, SyncJobResult>): Promise<SyncJobResult> => {
    const { accountId } = job.data;

    const account = await AccountRepository.getAccountById(accountId);
    if (!account) {
        throw new NotFoundError('Account', accountId);
    }

    const userId = account.userId?.toString() || job.data.userId;
    const userEmail = account.emailAddress;

    setTraceContext({ userId, userEmail, accountId });
    if (userId) {
        monitoring.setUser({
            id: userId,
            email: userEmail,
        });
    }

    logger.info(`Processing background sync for account: ${accountId}`);

    // Gracefully abort sync if account is disabled or deactivated
    if (!validateAccountForSync(account, accountId)) {
        return { addedEmailsCount: 0, deletedEmailsCount: 0 };
    }

    const emailProvider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
    const folderService = new FolderService();

    // 1. Sync Folders & Labels
    logger.info(`Syncing folders for account: ${accountId}`);
    await folderService.syncFolders(userId, accountId);

    // 2. Sync Emails (Incremental vs Full Sync)
    logger.info(`Fetching email updates for account: ${accountId} (Cursor: ${account.lastSyncCursor || 'None'})`);

    let syncResult: SyncResult | null = await fetchMessagesWithRetry(emailProvider, accountId, account.lastSyncCursor);
    let isFullSync = false;

    // Fallback to full sync if incremental sync returned null (or cursor was null/expired)
    if (!syncResult) {
        logger.info(`Performing full email sync for account: ${accountId}`);
        isFullSync = true;
        syncResult = await fetchMessagesWithRetry(emailProvider, accountId);
    }

    if (!syncResult) {
        logger.warn(`No sync result found for account: ${accountId}`);
        return { addedEmailsCount: 0, deletedEmailsCount: 0 };
    }

    const { addedEmailsCount, deletedEmailsCount } = await upsertAccountSyncData(userId, accountId, syncResult, isFullSync);

    logger.info(`Background sync completed for account ${accountId}. Added: ${addedEmailsCount}, Deleted: ${deletedEmailsCount}`);

    return {
        addedEmailsCount,
        deletedEmailsCount,
    };
};
