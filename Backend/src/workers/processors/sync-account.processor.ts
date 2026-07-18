import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { EmailRepository } from '@modules/emails/email.repository.js';
import { FolderService } from '@modules/folders/folder.service.js';
import { AccountProvider } from '@types';
import { logger } from '@utils';
import { Job } from 'bullmq';
import { SyncAccountPayload } from 'core/queue/queue.service.js';
import { SyncJobResult } from 'workers/worker.types.js';

export const syncAccountProcessor = async (job: Job<SyncAccountPayload, SyncJobResult>): Promise<SyncJobResult> => {
    const { accountId } = job.data;

    logger.info(`Processing background sync for account: ${accountId}`);

    const account = await AccountRepository.getAccountById(accountId);
    if (!account) {
        throw new Error(`Account not found: ${accountId}`);
    }

    if (!account.active) {
        throw new Error(`Account is inactive: ${accountId}`);
    }

    const emailProvider = EmailProviderFactory.getProvider(account.provider as AccountProvider);
    const folderService = new FolderService();

    // 1. Sync Folders & Labels
    logger.info(`Syncing folders for account: ${accountId}`);
    await folderService.syncFolders(accountId);

    // 2. Sync Emails (Incremental vs Full Sync)
    logger.info(`Fetching email updates for account: ${accountId} (Cursor: ${account.lastSyncCursor || 'None'})`);
    const historyDetails = await emailProvider.fetchMessages(accountId, account.lastSyncCursor);

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
        }

        await AccountRepository.updateAccount(accountId, {
            lastSyncedAt: Date.now(),
            lastSyncCursor: newCursor,
        });
    } else {
        logger.info(`Performing full email sync for account: ${accountId}`);
        const fullSyncResult = await emailProvider.fetchMessages(accountId);

        if (fullSyncResult) {
            const { addedEmails, newCursor } = fullSyncResult;

            // Delete all previous emails for full sync
            logger.info(`Clearing existing emails for full sync of account: ${accountId}`);
            await EmailRepository.deleteEmailsByAccountId(accountId);

            if (addedEmails && addedEmails.length > 0) {
                logger.info(`Upserting ${addedEmails.length} emails after full sync for account: ${accountId}`);
                await EmailRepository.upsertEmailsInBulk(addedEmails);
                addedEmailsCount = addedEmails.length;
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
