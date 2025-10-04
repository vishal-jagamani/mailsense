import { EmailRepository } from '@modules/emails/email.repository.js';
import { decompressString } from '@utils/compression.js';
import { logger } from '@utils/logger.js';
import { GetEmailsResponse } from 'types/email.types.js';
import { EMAIL_LIST_DB_FIELD_MAPPING } from './email.constants.js';

export class EmailService {
    public async getEmails(accountId: string, size: number, page: number): Promise<GetEmailsResponse> {
        try {
            const emails = await EmailRepository.getEmails(accountId, size, page, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            const total = await EmailRepository.countDocuments(accountId);
            const data = emails.map((email) => ({
                ...email,
                ...(email.body && { body: decompressString(email.body) }),
                ...(email.bodyHtml && { bodyHtml: decompressString(email.bodyHtml) }),
                ...(email.bodyPlain && { bodyPlain: decompressString(email.bodyPlain) }),
            }));
            return { data, size, page, total };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.getEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
