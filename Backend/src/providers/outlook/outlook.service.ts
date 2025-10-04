import { logger } from '@utils/logger.js';
import { OutlookOAuthAccessTokenResponse } from 'types/account.types.js';
import { OutlookApi } from './outlook.api.js';
import { OutlookUserProfile } from './outlook.types.js';

export class OutlookService {
    private outlookApi: OutlookApi;
    constructor() {
        this.outlookApi = new OutlookApi();
    }
    async getAccessTokenFromCode(code: string): Promise<OutlookOAuthAccessTokenResponse> {
        try {
            const response = await this.outlookApi.getAccessTokenFromCode(code);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.getAccessTokenFromCode: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getUserProfileFromAccessToken(accessToken: string): Promise<OutlookUserProfile> {
        try {
            const response = await this.outlookApi.getUserProfileFromAccessToken(accessToken);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in OutlookService.getUserProfileFromAccessToken: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
