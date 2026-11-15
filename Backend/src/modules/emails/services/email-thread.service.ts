import { LOGGER_MODULE } from '@constants';
import { ForbiddenError, NotFoundError } from '@errors';
import { EmailProviderFactory } from '@integrations/email/index.js';
import { ACCOUNT_PROVIDER, GetThreadResponse } from '@mailsense/types';
import { AccountRepository } from '@modules/accounts/database/index.js';
import { createLogger } from '@observability';
import { decompressString } from '@utils';
import { EmailDocument, EmailInput, EmailRepository } from '../database/index.js';

const logger = createLogger(LOGGER_MODULE.EMAIL_SERVICE);

export class EmailThreadService {
    public async getEmail(userId: string, emailId: string): Promise<EmailDocument | EmailInput | null> {
        try {
            const email = await EmailRepository.getEmail(emailId);
            if (!email) {
                throw new NotFoundError('Email', emailId);
            }

            const account = await AccountRepository.getAccountById(email.accountId, { provider: 1, userId: 1 });
            if (!account) {
                throw new NotFoundError('Account', email.accountId);
            }

            if (account.userId !== userId) {
                throw new ForbiddenError('Unauthorized attempt to access email');
            }

            const provider = EmailProviderFactory.getProvider(account.provider as ACCOUNT_PROVIDER);
            return provider.getMessageDetails(email.accountId, email.providerMessageId, email);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.getEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async getThread(userId: string, emailId: string): Promise<GetThreadResponse> {
        try {
            const email = await EmailRepository.getEmail(emailId);
            if (!email) {
                throw new NotFoundError('Email', emailId);
            }

            const account = await AccountRepository.getAccountById(email.accountId, { userId: 1 });
            if (!account) {
                throw new NotFoundError('Account', email.accountId);
            }

            if (account.userId !== userId) {
                throw new ForbiddenError('Unauthorized attempt to access email thread');
            }

            const threadEmails = await EmailRepository.getEmailsByThreadId(email.threadId, email.accountId);

            const decompressedThread = threadEmails.map((item) => ({
                ...item,
                _id: item._id.toString(),
                bodyHtml: item.bodyHtml ? decompressString(item.bodyHtml) : '',
                bodyPlain: item.bodyPlain ? decompressString(item.bodyPlain) : '',
            }));

            return {
                thread: decompressedThread,
                threadId: email.threadId,
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.getThread: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
