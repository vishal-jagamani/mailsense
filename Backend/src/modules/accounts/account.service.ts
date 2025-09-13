import { GmailService } from '@providers/gmail/gmail.service.js';
import { buildGmailOAuthConsentURL } from '@providers/gmail/gmail.utils.js';
import { OutlookService } from '@providers/outlook/outlook.service.js';
import { buildOutlookOAuthConsentURL } from '@providers/outlook/outlook.utils.js';
import { encrypt } from '@utils/crypto.js';
import { logger } from '@utils/logger.js';
import { AccountProvider, OutlookOAuthAccessTokenResponse } from 'types/account.types';
import { AccountInput } from './account.model.js';
import * as AccountRepository from './account.repository.js';

export class AccountsService {
    private gmailService: GmailService;
    private outlookService: OutlookService;

    constructor() {
        this.gmailService = new GmailService();
        this.outlookService = new OutlookService();
    }

    async connect(provider: string): Promise<string> {
        try {
            if (provider === AccountProvider.GMAIL) {
                return buildGmailOAuthConsentURL();
            } else if (provider === AccountProvider.OUTLOOK) {
                return buildOutlookOAuthConsentURL();
            } else {
                throw new Error('Invalid provider');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.connect: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async callback(provider: string, params: any): Promise<void> {
        try {
            if (provider === AccountProvider.GMAIL) {
                const { code } = params;
                const accessTokenResponse = await this.gmailService.getAccessTokenFromCode(code);
                const { access_token, refresh_token, expires_in, scope } = accessTokenResponse;
                // Save in db
                const account: AccountInput = {
                    id: Date.now(),
                    userId: '1',
                    provider: AccountProvider.GMAIL,
                    emailAddress: 'vishaljagamani20@gmail.com',
                    accessToken: encrypt(access_token),
                    refreshToken: encrypt(refresh_token),
                    accessTokenExpiry: expires_in,
                    refreshTokenExpiry: expires_in,
                    scope,
                    syncEnabled: true,
                    syncInterval: 60,
                    lastSyncedAt: Date.now(),
                };
                const savedAccount = await AccountRepository.createAccount(account);
                logger.info('response', { accessTokenResponse, savedAccount });
            } else if (provider === AccountProvider.OUTLOOK) {
                const { code } = params;
                const response: OutlookOAuthAccessTokenResponse = await this.outlookService.getAccessTokenFromCode(code);
                const { access_token, refresh_token, expires_in, scope } = response;
                // Save in db
                const account: AccountInput = {
                    id: Date.now(),
                    userId: '1',
                    provider: AccountProvider.OUTLOOK,
                    emailAddress: 'vishaljagamani20@gmail.com',
                    accessToken: encrypt(access_token),
                    refreshToken: encrypt(refresh_token),
                    accessTokenExpiry: expires_in,
                    refreshTokenExpiry: expires_in,
                    scope,
                    syncEnabled: true,
                    syncInterval: 60,
                    lastSyncedAt: Date.now(),
                };
                const savedAccount = await AccountRepository.createAccount(account);
                logger.info('response', { response, savedAccount });
            } else {
                throw new Error('Invalid provider');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.callback: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
