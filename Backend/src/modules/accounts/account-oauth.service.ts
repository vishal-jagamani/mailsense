import { MAILSENSE_BASE_URL } from '@config';
import { LOGGER_MODULE } from '@constants';
import { BadRequestError } from '@errors';
import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';
import * as GmailUtils from '@integrations/gmail/gmail.utils.js';
import * as OutlookUtils from '@integrations/outlook/outlook.utils.js';
import { ACCOUNT_PROVIDER } from '@mailsense/types';
import { createLogger } from '@observability';
import { decrypt, encrypt } from '@utils';
import { SchedulerService } from 'core/queue/scheduler.service.js';
import { AccountInput } from './account.model.js';
import { AccountRepository } from './account.repository.js';
import { OAuthCallbackParams, OAuthConnectResponse } from './account.types.js';

const logger = createLogger(LOGGER_MODULE.ACCOUNT_SERVICE);

export class AccountOAuthService {
    public async connect(provider: string): Promise<OAuthConnectResponse> {
        try {
            if (provider === ACCOUNT_PROVIDER.GMAIL) {
                const url = await GmailUtils.buildGmailOAuthConsentURL();
                return { url };
            }
            if (provider === ACCOUNT_PROVIDER.OUTLOOK) {
                const url = await OutlookUtils.buildOutlookOAuthConsentURL();
                return { url };
            }
            throw new BadRequestError('Invalid provider');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountOAuthService.connect: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async handleCallback(
        provider: string,
        params: OAuthCallbackParams,
        onAccountSynced?: (userId: string, accountId: string) => void,
    ): Promise<string> {
        try {
            const { code, state } = params;
            let userDetails: { readonly id: string };
            try {
                const decryptedState = decrypt(state);
                userDetails = JSON.parse(decryptedState);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                logger.error(`Error in AccountOAuthService.handleCallback state decryption: ${errorMessage}`, { error: err });
                throw err;
            }

            const emailProvider = EmailProviderFactory.getProvider(provider as ACCOUNT_PROVIDER);
            const { access_token, refresh_token, expires_in, scope } = await emailProvider.getAccessTokenFromCode(code);
            const userProfile = await emailProvider.getUserProfileFromAccessToken(access_token);
            const emailAddress = 'email' in userProfile ? userProfile.email : userProfile.mail;

            const account: Partial<AccountInput> = {
                userId: userDetails.id,
                provider: provider as ACCOUNT_PROVIDER,
                emailAddress,
                userProfileDetails: userProfile,
                accessToken: encrypt(access_token),
                refreshToken: encrypt(refresh_token),
                accessTokenExpiry: Date.now() + expires_in * 1000,
                refreshTokenExpiry: expires_in,
                scope,
                syncEnabled: false,
                syncInterval: 60,
                lastSyncedAt: Date.now(),
                active: true,
            };

            const savedAccount = await AccountRepository.upsertAccount(account);

            await SchedulerService.upsertAccountRepeatableJob(String(savedAccount._id));

            if (onAccountSynced) {
                onAccountSynced(userDetails.id, String(savedAccount._id));
            }

            return MAILSENSE_BASE_URL;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountOAuthService.handleCallback: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}

export const accountOAuthService = new AccountOAuthService();
