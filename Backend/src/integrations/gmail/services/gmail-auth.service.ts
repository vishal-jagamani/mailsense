import { LOGGER_MODULE } from '@constants';
import { GmailOAuthAccessTokenResponse, GmailUserProfile } from '@mailsense/types';
import { createLogger } from '@observability';
import { GmailClient } from '../clients/index.js';

const logger = createLogger(LOGGER_MODULE.GMAIL_SERVICE);

export class GmailAuthService {
    async getAccessTokenFromCode(code: string): Promise<GmailOAuthAccessTokenResponse> {
        try {
            const response = await GmailClient.getAccessTokenFromCode(code);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getAccessTokenFromCode: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getUserProfileFromAccessToken(accessToken: string): Promise<GmailUserProfile> {
        try {
            const response = await GmailClient.getUserProfileFromAccessToken(accessToken);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getUserProfileFromAccessToken: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
