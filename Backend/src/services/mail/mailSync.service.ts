import { AccountRepository } from '@modules/accounts/account.repository.js';
import { EmailInput } from '@modules/emails/email.model.js';
import { EmailRepository } from '@modules/emails/email.repository.js';
import { GmailApi } from '@providers/gmail/gmail.api.js';
import { GmailService } from '@providers/gmail/gmail.service.js';
import { OutlookService } from '@providers/outlook/outlook.service.js';
import { logger } from '@utils/logger.js';

export class MailSyncService {
    private gmailService: GmailService;
    private gmailApi: GmailApi;
    private outlookService: OutlookService;

    constructor() {
        this.gmailService = new GmailService();
        this.gmailApi = new GmailApi();
        this.outlookService = new OutlookService();
    }

    async syncAccount(userId: string, accountId: string) {
        // Fetch account details from DB
        const account = await this.getAccountFromDB(accountId);
        if (!account) throw new Error('Account not found');
        const accessToken = await this.gmailApi.fetchAccessToken(accountId);
        const emails = await this.fetchAccountEmails(accountId, account.provider, accessToken);
        await EmailRepository.upsertEmailsInBulk(emails);
        return emails;
    }

    private async fetchAccountEmails(accountId: string, provider: string, accessToken: string): Promise<EmailInput[]> {
        try {
            if (provider === 'gmail') {
                return await this.gmailService.getMessages(accountId, accessToken);
            }
            return [];
        } catch (error) {
            logger.error(`❌ Error fetching emails for account ${accountId}`, { error });
            throw error;
        }
    }

    private async getAccountFromDB(accountId: string) {
        const account = await AccountRepository.getAccountById(accountId);
        return account;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async saveEmailToDB(accountId: string, email: any) {
        // TODO: replace with MongoDB save logic
        console.log(`📥 Saving email ${email.id} for account ${accountId}`);
        return { id: email.id };
    }

    private async upsertEmailsToDB(accountId: string, emails: EmailInput[]) {
        // TODO: replace with MongoDB upsert logic
        console.log(`📥 Upserting ${emails.length} emails for account ${accountId}`);

        return emails;
    }
}
