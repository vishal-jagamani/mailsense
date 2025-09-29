import { EmailDocument } from '@modules/emails/email.model.js';

export interface GetEmailsResponse {
    data: EmailDocument[];
    size: number;
    page: number;
    total: number;
}
