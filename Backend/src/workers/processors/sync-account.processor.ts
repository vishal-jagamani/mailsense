import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';
import { SyncResult } from '@integrations/email/email.provider.js';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { EmailRepository } from '@modules/emails/email.repository.js';
import { FolderService } from '@modules/folders/folder.service.js';
import { AccountProvider } from '@types';
import { logger } from '@utils';
import { Job } from 'bullmq';
import { eventBus } from '../../core/events/event-bus.js';
import { SystemEvent } from '../../core/events/event.types.js';
import { RefreshTokenPayload, SyncAccountPayload } from '../../core/queue/queue.service.js';
import { SyncJobResult } from '../worker.types.js';
import { refreshTokenProcessor } from './refresh-token.processor.js';

interface ErrorWithStatus {
    status?: number;
    statusCode?: number;
    response?: {
        status?: number;
        statusCode?: number;
    };
}

function isTokenExpiryError(error: Error | ErrorWithStatus | null | undefined): boolean {
    if (!error) return false;
    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('unauthorized') || msg.includes('expired') || msg.includes('invalid credentials')) {
            return true;
        }
    }
    const err = error as ErrorWithStatus;
    if (err.status === 401 || err.statusCode === 401) {
        return true;
    }
    if (err.response && (err.response.status === 401 || err.response.statusCode === 401)) {
        return true;
    }
    return false;
}

export const syncAccountProcessor = async (job: Job<SyncAccountPayload, SyncJobResult>): Promise<SyncJobResult> => {
    const { accountId } = job.data;

    logger.info(`Processing background sync for account: ${accountId}`);

    const account = await AccountRepository.getAccountById(accountId);
    if (!account) {
        throw new Error(`Account not found: ${accountId}`);
    }

    // Gracefully abort sync if account is disabled or deactivated
    if (!account.active) {
        logger.warn(`⚠️ Sync execution aborted. Account is inactive: ${accountId}`);
        return { addedEmailsCount: 0, deletedEmailsCount: 0 };
    }

    if (!account.syncEnabled) {
        logger.warn(`⚠️ Sync execution aborted. Sync is disabled: ${accountId}`);
        return { addedEmailsCount: 0, deletedEmailsCount: 0 };
    }

    const emailProvider = EmailProviderFactory.getProvider(account.provider as AccountProvider);
    const folderService = new FolderService();

    // 1. Sync Folders & Labels
    logger.info(`Syncing folders for account: ${accountId}`);
    await folderService.syncFolders(accountId);

    // 2. Sync Emails (Incremental vs Full Sync)
    logger.info(`Fetching email updates for account: ${accountId} (Cursor: ${account.lastSyncCursor || 'None'})`);

    let historyDetails: SyncResult | null = null;
    try {
        historyDetails = await emailProvider.fetchMessages(accountId, account.lastSyncCursor);
    } catch (error) {
        if (isTokenExpiryError(error as Error | ErrorWithStatus)) {
            logger.info(`🔑 Token validation failed for account ${accountId}. Running inline token refresh...`);
            await refreshTokenProcessor({ data: { accountId } } as Job<RefreshTokenPayload, { status: boolean }>);

            const updatedAccount = await AccountRepository.getAccountById(accountId);
            if (!updatedAccount || !updatedAccount.active) {
                throw new Error(`Account disabled or missing post token refresh: ${accountId}`);
            }
            logger.info(`🔑 Retrying fetchMessages for account: ${accountId}`);
            historyDetails = await emailProvider.fetchMessages(accountId, updatedAccount.lastSyncCursor);
        } else {
            throw error;
        }
    }

    let addedEmailsCount = 0;
    let deletedEmailsCount = 0;

    if (historyDetails) {
        const { addedEmails, deletedEmailIds, newCursor } = historyDetails;

        if (deletedEmailIds && deletedEmailIds.length > 0) {
            logger.info(`Deleting ${deletedEmailIds.length} emails for account: ${accountId}`);
            await EmailRepository.deleteManyEmails(deletedEmailIds);
            deletedEmailsCount = deletedEmailIds.length;
        }

        if (addedEmails && addedEmails.length > 0) {
            logger.info(`Upserting ${addedEmails.length} new/updated emails for account: ${accountId}`);
            await EmailRepository.upsertEmailsInBulk(addedEmails);
            addedEmailsCount = addedEmails.length;

            // Emit EMAIL_CREATED for each newly indexed message
            for (const email of addedEmails) {
                eventBus.publish(SystemEvent.EMAIL_CREATED, {
                    accountId,
                    email,
                });
            }
        }

        await AccountRepository.updateAccount(accountId, {
            lastSyncedAt: Date.now(),
            lastSyncCursor: newCursor,
        });
    } else {
        logger.info(`Performing full email sync for account: ${accountId}`);
        let fullSyncResult = null;
        try {
            fullSyncResult = await emailProvider.fetchMessages(accountId);
        } catch (error) {
            if (isTokenExpiryError(error as Error | ErrorWithStatus)) {
                logger.info(`🔑 Token validation failed during full sync for account ${accountId}. Running inline token refresh...`);
                await refreshTokenProcessor({ data: { accountId } } as Job<RefreshTokenPayload, { status: boolean }>);

                const updatedAccount = await AccountRepository.getAccountById(accountId);
                if (!updatedAccount || !updatedAccount.active) {
                    throw new Error(`Account disabled or missing post token refresh: ${accountId}`);
                }
                logger.info(`🔑 Retrying full sync fetchMessages for account: ${accountId}`);
                fullSyncResult = await emailProvider.fetchMessages(accountId);
            } else {
                throw error;
            }
        }

        if (fullSyncResult) {
            const { addedEmails, newCursor } = fullSyncResult;

            // Delete all previous emails for full sync
            logger.info(`Clearing existing emails for full sync of account: ${accountId}`);
            await EmailRepository.deleteEmailsByAccountId(accountId);

            if (addedEmails && addedEmails.length > 0) {
                logger.info(`Upserting ${addedEmails.length} emails after full sync for account: ${accountId}`);
                await EmailRepository.upsertEmailsInBulk(addedEmails);
                addedEmailsCount = addedEmails.length;

                // Emit EMAIL_CREATED for each newly indexed message
                for (const email of addedEmails) {
                    eventBus.publish(SystemEvent.EMAIL_CREATED, {
                        accountId,
                        email,
                    });
                }
            }

            await AccountRepository.updateAccount(accountId, {
                lastSyncedAt: Date.now(),
                lastSyncCursor: newCursor,
            });
        }
    }

    logger.info(`Background sync completed for account ${accountId}. Added: ${addedEmailsCount}, Deleted: ${deletedEmailsCount}`);

    return {
        addedEmailsCount,
        deletedEmailsCount,
    };
};
