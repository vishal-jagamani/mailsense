import { LOGGER_MODULE } from '@constants';
import { OutlookMessageObjectFull, OutlookOAuthAccessTokenResponse, OutlookUserProfile } from '@mailsense/types';
import { EmailInput } from '@modules/emails/email.model.js';
import { createLogger } from '@observability';
import { OutlookClient } from '../clients/index.js';
import { ExtractDeltaMessageChangesResponse, GetOutlookDeltaMessagesResponse } from '../outlook.types.js';
import { OutlookMailService } from './outlook-mail.service.js';

const logger = createLogger(LOGGER_MODULE.OUTLOOK_SERVICE);

export class OutlookSyncService {
    constructor(private readonly outlookMailService: OutlookMailService = new OutlookMailService()) {}

    async getAccessTokenFromCode(code: string): Promise<OutlookOAuthAccessTokenResponse> {
        try {
            const response = await OutlookClient.getAccessTokenFromCode(code);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.getAccessTokenFromCode: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getUserProfileFromAccessToken(accessToken: string): Promise<OutlookUserProfile> {
        try {
            const response = await OutlookClient.getUserProfileFromAccessToken(accessToken);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.getUserProfileFromAccessToken: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getMessagesAfterLastDelta(accountId: string, deltaLink: string): Promise<GetOutlookDeltaMessagesResponse | null> {
        try {
            if (!deltaLink) return null;
            const response = await OutlookClient.getMessagesFromDeltaLink(accountId, deltaLink);
            const { addedEmails, deletedEmailIds } = await this.extractDeltaMessagesChanges(response.value);
            let newAddedEmails: Partial<EmailInput>[] = [];
            if (addedEmails.length) {
                newAddedEmails = await this.outlookMailService.parseEmailsIntoPlainObjects(accountId, addedEmails);
            }
            return { addedEmails: newAddedEmails, deletedEmailIds, newDeltaLink: response['@odata.deltaLink'] || '' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.getMessagesAfterLastDelta: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private async extractDeltaMessagesChanges(emails: OutlookMessageObjectFull[]): Promise<ExtractDeltaMessageChangesResponse> {
        try {
            const addedEmails: OutlookMessageObjectFull[] = [];
            const deletedEmailIds: string[] = [];
            for (const email of emails) {
                if ('@removed' in email) {
                    deletedEmailIds.push(email.id);
                } else {
                    addedEmails.push(email);
                }
            }
            return { addedEmails, deletedEmailIds };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.extractMessagesChanges: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
