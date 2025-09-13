import { GMAIL_SECRETS } from '@config/config.js';
import { OAUTH_ACCESS_TOKEN_URI } from '@constants/index.js';
import { apiRequest } from '@utils/axios.js';
import { logger } from '@utils/logger.js';
import { AxiosRequestConfig } from 'axios';
import { GmailOAuthAccessTokenResponse } from 'types/account.types';

export class GmailService {
    async getAccessTokenFromCode(code: string): Promise<GmailOAuthAccessTokenResponse> {
        try {
            const options: AxiosRequestConfig = {
                url: OAUTH_ACCESS_TOKEN_URI.GMAIL,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: {
                    code,
                    client_id: GMAIL_SECRETS.client_id,
                    client_secret: GMAIL_SECRETS.client_secret,
                    redirect_uri: GMAIL_SECRETS.redirect_uri,
                    grant_type: 'authorization_code',
                },
            };
            const response: GmailOAuthAccessTokenResponse = await apiRequest(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getAccessTokenFromCode: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
