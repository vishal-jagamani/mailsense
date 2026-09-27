import { LOGGER_MODULE } from '@constants';
import { BadRequestError, ForbiddenError, NotFoundError } from '@errors';
import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';
import { AccountBatchMoveTaskResult } from '@integrations/email/email.provider.types.js';
import { ACCOUNT_PROVIDER, MoveEmailsResponse, SuccessAPIResponse, UpdateAPIResponse } from '@mailsense/types';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { AttachmentsService } from '@modules/attachments/attachment.service.js';
import { FolderRepository } from '@modules/folders/folder.repository.js';
import { createLogger } from '@observability';
import { EMAIL_LIST_DB_FIELD_MAPPING } from './email.constants.js';
import { EmailRepository } from './email.repository.js';
import { ComposeEmailBody } from './email.schema.js';

const logger = createLogger(LOGGER_MODULE.EMAIL_SERVICE);

export class EmailWriteService {
    private attachmentsService: AttachmentsService;

    constructor() {
        this.attachmentsService = new AttachmentsService();
    }

    public async deleteEmail(userId: string, emailIds: string[], trash?: boolean): Promise<UpdateAPIResponse> {
        try {
            const emailList = await EmailRepository.getEmailsByIds(emailIds, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            if (!emailList.length) {
                throw new NotFoundError('Emails', emailIds.join(', '));
            }
            const accountIds = Array.from(new Set(emailList.map((email) => email.accountId)));
            const userAccounts = await AccountRepository.getAccounts({
                userId,
                _id: { $in: accountIds },
            });
            if (userAccounts.length !== accountIds.length) {
                throw new ForbiddenError('Unauthorized attempt to delete emails from unowned accounts');
            }
            const groupedEmails = Object.groupBy(emailList, (item) => item.accountId);
            for (const [accountId, emails] of Object.entries(groupedEmails)) {
                const account = userAccounts.find((acc) => acc._id.toString() === accountId);
                if (!account || !emails) continue;
                const provider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
                // Extract providerMessageId for external provider deletion
                await provider.deleteEmails(
                    emails.map((email) => email.providerMessageId),
                    accountId,
                    trash,
                );
            }
            return { status: true, message: 'Emails deleted successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.deleteEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async archiveEmails(userId: string, emailIds: string[], archive: boolean): Promise<UpdateAPIResponse> {
        try {
            const emailList = await EmailRepository.getEmailsByIds(emailIds, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            if (!emailList.length) {
                throw new NotFoundError('Emails', emailIds.join(', '));
            }
            const accountIds = Array.from(new Set(emailList.map((email) => email.accountId)));
            const userAccounts = await AccountRepository.getAccounts({
                userId,
                _id: { $in: accountIds },
            });
            if (userAccounts.length !== accountIds.length) {
                throw new ForbiddenError('Unauthorized attempt to archive emails from unowned accounts');
            }
            const groupedEmails = Object.groupBy(emailList, (item) => item.accountId);
            for (const [accountId, emails] of Object.entries(groupedEmails)) {
                const account = userAccounts.find((acc) => acc._id.toString() === accountId);
                if (!account || !emails) continue;
                const provider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
                await provider.archiveEmails(
                    emails.map((email) => email.providerMessageId),
                    accountId,
                    archive,
                );
            }
            return { status: true, message: 'Emails archived successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.archiveEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async starEmails(userId: string, emailIds: string[], star: boolean): Promise<UpdateAPIResponse> {
        try {
            const emailList = await EmailRepository.getEmailsByIds(emailIds, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            if (!emailList.length) {
                throw new NotFoundError('Emails', emailIds.join(', '));
            }
            const accountIds = Array.from(new Set(emailList.map((email) => email.accountId)));
            const userAccounts = await AccountRepository.getAccounts({
                userId,
                _id: { $in: accountIds },
            });
            if (userAccounts.length !== accountIds.length) {
                throw new ForbiddenError('Unauthorized attempt to star emails from unowned accounts');
            }
            const groupedEmails = Object.groupBy(emailList, (item) => item.accountId);
            for (const [accountId, emails] of Object.entries(groupedEmails)) {
                const account = userAccounts.find((acc) => acc._id.toString() === accountId);
                if (!account || !emails) continue;
                const provider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
                await provider.starEmails(
                    emails.map((email) => ({ id: String(email._id), providerMessageId: email.providerMessageId })),
                    accountId,
                    star,
                );
            }
            return { status: true, message: `${star ? 'Starred' : 'Unstarred'} emails successfully` };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.starEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async unreadEmails(userId: string, emailIds: string[], unread: boolean): Promise<UpdateAPIResponse> {
        try {
            const emailList = await EmailRepository.getEmailsByIds(emailIds, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            if (!emailList.length) {
                throw new NotFoundError('Emails', emailIds.join(', '));
            }

            const accountIds = Array.from(new Set(emailList.map((email) => email.accountId)));
            const userAccounts = await AccountRepository.getAccounts({
                userId,
                _id: { $in: accountIds },
            });
            if (userAccounts.length !== accountIds.length) {
                throw new ForbiddenError('Unauthorized attempt to update emails from unowned accounts');
            }

            const groupedEmails = Object.groupBy(emailList, (item) => item.accountId);
            for (const [accountId, emails] of Object.entries(groupedEmails)) {
                const account = userAccounts.find((acc) => String(acc._id) === accountId);
                if (!account || !emails) continue;
                const provider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
                await provider.unreadEmails(
                    emails.map((email) => email.providerMessageId),
                    accountId,
                    unread,
                );
            }

            return { status: true, message: 'Unread emails status updated successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.unreadEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async composeEmail(userId: string, composeEmailData: ComposeEmailBody): Promise<SuccessAPIResponse> {
        try {
            const account = await AccountRepository.getAccountById(composeEmailData.accountId, { provider: 1 });
            if (!account) {
                throw new NotFoundError('Account', composeEmailData.accountId);
            }
            if (composeEmailData.attachmentIds && composeEmailData.attachmentIds.length) {
                return await this.composeEmailWithAttachments(userId, composeEmailData);
            } else {
                const provider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
                await provider.sendMail(composeEmailData);
                return { status: true, message: 'Email composed successfully' };
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.composeEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private async composeEmailWithAttachments(userId: string, reqBody: ComposeEmailBody): Promise<SuccessAPIResponse> {
        try {
            const { accountId, to, subject, body, attachmentIds } = reqBody;

            const account = await AccountRepository.getAccountById(accountId);
            if (!account) {
                throw new NotFoundError('Account', accountId);
            }
            if (account.userId.toString() !== userId.toString()) {
                throw new ForbiddenError('Unauthorized attempt to compose email from unowned account');
            }
            const stagedFiles: { filename: string; mimeType: string; buffer: Buffer }[] = [];
            if (attachmentIds && attachmentIds.length > 0) {
                for (const attId of attachmentIds) {
                    const { stagedAttachment, stream } = await this.attachmentsService.getStagedAttachmentWithStream(attId);

                    // Verify attachment belongs to user and matches target account
                    // if (stagedAttachment.userId.toString() !== userId.toString() || stagedAttachment.accountId !== accountId) {
                    //     throw new ForbiddenError(`Unauthorized or invalid attachment ${attId}`);
                    // }

                    const chunks: Buffer[] = [];
                    for await (const chunk of stream) {
                        chunks.push(Buffer.from(chunk));
                    }
                    stagedFiles.push({
                        filename: stagedAttachment.filename,
                        mimeType: stagedAttachment.mimeType,
                        buffer: Buffer.concat(chunks),
                    });
                }
            }

            const provider = EmailProviderFactory.getProvider(account.provider);
            await provider.sendMail({ accountId, to, subject, body, attachments: stagedFiles });

            if (attachmentIds && attachmentIds.length > 0) {
                this.attachmentsService.cleanupStagedAttachments(attachmentIds);
            }

            return { status: true, message: 'Email composed and sent successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.composeEmailWithAttachments: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async moveEmails(
        userId: string,
        emailIds: string[],
        targetFolderIds: string[],
        removeFolderIds: string[] = [],
    ): Promise<MoveEmailsResponse> {
        try {
            if (!emailIds.length) {
                return { success: true, updatedCount: 0 };
            }

            const emailDocs = await EmailRepository.getEmailsByIds(emailIds, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);

            if (!emailDocs.length) {
                throw new NotFoundError('Emails', emailIds.join(', '));
            }

            const accountIds = Array.from(new Set(emailDocs.map((email) => email.accountId)));
            const userAccounts = await AccountRepository.getAccounts({
                userId,
                _id: { $in: accountIds },
            });

            if (userAccounts.length !== accountIds.length) {
                throw new ForbiddenError('Unauthorized attempt to move emails from unowned accounts');
            }

            const allFolderIds = [...targetFolderIds, ...removeFolderIds];
            const folderDocs = await FolderRepository.getFoldersByIds(allFolderIds);
            const folderMap = new Map<string, string>();
            folderDocs.forEach((folder) => {
                folderMap.set(String(folder._id), folder.providerFolderId);
            });
            const targetProviderFolderIds = targetFolderIds.map((id) => folderMap.get(id) || id);
            const removeProviderFolderIds = removeFolderIds.map((id) => folderMap.get(id) || id);

            const groupedEmails = Object.groupBy(emailDocs, (item) => item.accountId);

            // Parallelized execution across accounts via Promise.allSettled
            const movePromises = Object.entries(groupedEmails).map(async ([accountId, emails]): Promise<AccountBatchMoveTaskResult> => {
                try {
                    const account = userAccounts.find((acc) => String(acc._id) === accountId);
                    if (!account || !emails || emails.length === 0) {
                        return { accountId, successfulDbEmailIds: [], count: 0 };
                    }

                    const provider = EmailProviderFactory.getProvider(account.provider);
                    const providerMessageIds = emails.map((email) => email.providerMessageId);
                    await provider.moveEmails(providerMessageIds, accountId, targetProviderFolderIds, removeProviderFolderIds);

                    return {
                        accountId,
                        successfulDbEmailIds: emails.map((email) => String(email._id)),
                        count: emails.length,
                    };
                } catch (taskErr) {
                    const errorMessage = taskErr instanceof Error ? taskErr.message : String(taskErr);
                    logger.error('Account-level provider moveEmails failed', { accountId, error: errorMessage });
                    throw taskErr;
                }
            });

            const settledResults = await Promise.allSettled(movePromises);

            const successfulDbEmailIds: string[] = [];
            let updatedCount = 0;
            const failedAccounts: string[] = [];

            settledResults.forEach((result, index) => {
                const accountId = Object.keys(groupedEmails)[index];
                if (result.status === 'fulfilled') {
                    successfulDbEmailIds.push(...result.value.successfulDbEmailIds);
                    updatedCount += result.value.count;
                } else {
                    failedAccounts.push(accountId);
                    logger.warn('Move operation rejected for account', {
                        accountId,
                        reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
                    });
                }
            });

            // Update database records ONLY for emails whose provider move succeeded
            if (successfulDbEmailIds.length > 0) {
                await EmailRepository.updateFolders(successfulDbEmailIds, targetProviderFolderIds, removeProviderFolderIds);
            }

            if (updatedCount === 0 && failedAccounts.length > 0) {
                throw new BadRequestError(`Failed to move emails across accounts: ${failedAccounts.join(', ')}`);
            }

            return { success: true, updatedCount };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('Failed to execute moveEmails in EmailService', { emailIds, targetFolderIds, removeFolderIds, error: errorMessage });
            throw error;
        }
    }
}
