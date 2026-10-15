import { LOGGER_MODULE } from '@constants';
import { ForbiddenError, NotFoundError } from '@errors';
import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';
import { IEmailProvider } from '@integrations/email/email.provider.js';
import { ACCOUNT_PROVIDER, PerAccountActionContext, SuccessAPIResponse, UpdateAPIResponse } from '@mailsense/types';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { AttachmentsService } from '@modules/attachments/attachment.service.js';
import { createLogger } from '@observability';
import { EMAIL_LIST_DB_FIELD_MAPPING } from './email.constants.js';
import { EmailRepository } from './email.repository.js';
import { ComposeEmailBody } from './email.schema.js';
import { ComposeEmailAttachment } from './email.types.js';

const logger = createLogger(LOGGER_MODULE.EMAIL_SERVICE);

export class EmailWriteService {
    private attachmentsService: AttachmentsService;

    constructor(attachmentsService?: AttachmentsService) {
        this.attachmentsService = attachmentsService || new AttachmentsService();
    }

    /**
     * Centralized pipeline to group target emails by account, verify ownership,
     * and execute provider operations with uniform boundary logging and error handling.
     */
    private async executePerAccountProviderAction(
        userId: string,
        emailIds: readonly string[],
        actionDescription: string,
        action: (context: PerAccountActionContext, provider: IEmailProvider) => Promise<void>,
    ): Promise<UpdateAPIResponse> {
        try {
            const emailList = await EmailRepository.getEmailsByIds([...emailIds], EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            if (!emailList.length) {
                throw new NotFoundError('Emails', emailIds.join(', '));
            }

            const accountIds = Array.from(new Set(emailList.map((email) => email.accountId)));
            const userAccounts = await AccountRepository.getAccounts({
                userId,
                _id: { $in: accountIds },
            });

            if (userAccounts.length !== accountIds.length) {
                throw new ForbiddenError(`Unauthorized attempt to ${actionDescription} emails from unowned accounts`);
            }

            const groupedEmails = Object.groupBy(emailList, (item) => item.accountId);

            for (const [accountId, emails] of Object.entries(groupedEmails)) {
                const account = userAccounts.find((acc) => String(acc._id) === accountId);
                if (!account || !emails) continue;

                const provider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
                const accountEmailIds = emails.map((email) => String(email._id));
                const providerMessageIds = emails.map((email) => email.providerMessageId);
                await action({ accountId, emailIds: accountEmailIds, providerMessageIds }, provider);
            }

            return {
                status: true,
                message: `Emails ${actionDescription} successfully`,
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailWriteService.${actionDescription}: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async deleteEmail(userId: string, emailIds: string[], trash?: boolean): Promise<UpdateAPIResponse> {
        return this.executePerAccountProviderAction(userId, emailIds, 'delete', async (ctx, provider) => {
            await provider.deleteEmails(ctx.providerMessageIds, ctx.accountId, trash);
        });
    }

    public async archiveEmails(userId: string, emailIds: string[], archive: boolean): Promise<UpdateAPIResponse> {
        return this.executePerAccountProviderAction(userId, emailIds, 'archive', async (ctx, provider) => {
            await provider.archiveEmails(ctx.providerMessageIds, ctx.accountId, archive);
        });
    }

    public async starEmails(userId: string, emailIds: string[], star: boolean): Promise<UpdateAPIResponse> {
        return this.executePerAccountProviderAction(userId, emailIds, star ? 'star' : 'unstar', async (ctx, provider) => {
            const emailRefs = ctx.emailIds.map((id, index) => ({
                id,
                providerMessageId: ctx.providerMessageIds[index],
            }));
            await provider.starEmails(emailRefs, ctx.accountId, star);
        });
    }

    public async unreadEmails(userId: string, emailIds: string[], unread: boolean): Promise<UpdateAPIResponse> {
        return this.executePerAccountProviderAction(userId, emailIds, unread ? 'mark unread' : 'mark read', async (ctx, provider) => {
            await provider.unreadEmails(ctx.providerMessageIds, ctx.accountId, unread);
        });
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
            const stagedFiles: ComposeEmailAttachment[] = [];
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
                await this.attachmentsService.cleanupStagedAttachments(attachmentIds);
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
    ): Promise<UpdateAPIResponse> {
        return this.executePerAccountProviderAction(userId, emailIds, 'move', async (ctx, provider) => {
            await provider.moveEmails(ctx.providerMessageIds, ctx.accountId, targetFolderIds, removeFolderIds);
        });
    }
}
