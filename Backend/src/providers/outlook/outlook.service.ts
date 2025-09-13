import { AxiosRequestConfig } from 'axios';
import { OUTLOOK_SECRETS } from '@config/config.js';
import { OAUTH_ACCESS_TOKEN_URI } from '@constants/index.js';
import { OutlookOAuthAccessTokenResponse } from 'types/account.types';
import { apiRequest } from '@utils/axios.js';
import { logger } from '@utils/logger.js';

export class OutlookService {
    async getAccessTokenFromCode(code: string): Promise<OutlookOAuthAccessTokenResponse> {
        try {
            const options: AxiosRequestConfig = {
                url: OAUTH_ACCESS_TOKEN_URI.OUTLOOK,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: {
                    code,
                    client_id: OUTLOOK_SECRETS.client_id,
                    client_secret: OUTLOOK_SECRETS.client_secret,
                    redirect_uri: OUTLOOK_SECRETS.redirect_uri,
                    grant_type: 'authorization_code',
                },
            };
            const response: OutlookOAuthAccessTokenResponse = await apiRequest(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in GmailService.getAccessTokenFromCode: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
