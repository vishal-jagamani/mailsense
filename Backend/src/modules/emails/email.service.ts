import { EmailRepository } from '@modules/emails/email.repository.js';
import { decompressString } from '@utils/compression.js';
import { logger } from '@utils/logger.js';
import { GetEmailsResponse } from 'types/email.types.js';

export class EmailService {
    public async getEmails(accountId: string, size: number, page: number): Promise<GetEmailsResponse> {
        try {
            const emails = await EmailRepository.getEmails(accountId, size, page);
            const total = await EmailRepository.countDocuments(accountId);
            const data = emails.map((email) => ({
                ...email,
                body: email.body ? decompressString(email.body) : '',
                bodyHtml: email.bodyHtml ? decompressString(email.bodyHtml) : '',
                bodyPlain: email.bodyPlain ? decompressString(email.bodyPlain) : '',
            }));
            return { data, size, page, total };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.getEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
