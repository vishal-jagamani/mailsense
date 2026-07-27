import { GmailProvider } from '@integrations/gmail/gmail.provider.js';
import { OutlookProvider } from '@integrations/outlook/outlook.provider.js';
import {
    ACCOUNT_PROVIDER,
    GmailMessageObjectFull,
    GmailOAuthAccessTokenResponse,
    GmailUserProfile,
    OutlookMessageObjectFull,
    OutlookOAuthAccessTokenResponse,
    OutlookUserProfile,
} from '@mailsense/types';
import { IEmailProvider } from './email.provider.js';
import { IEmailTAuthToken, IEmailTSendEmailResult, IEmailTUserProfile } from './email.provider.types.js';

export class EmailProviderFactory {
    private static providers: Map<ACCOUNT_PROVIDER, IEmailProvider<IEmailTAuthToken, IEmailTUserProfile, IEmailTSendEmailResult>> = new Map();

    public static getProvider(
        providerType: ACCOUNT_PROVIDER.GMAIL,
    ): IEmailProvider<GmailOAuthAccessTokenResponse, GmailUserProfile, Partial<GmailMessageObjectFull>>;

    public static getProvider(
        providerType: ACCOUNT_PROVIDER.OUTLOOK,
    ): IEmailProvider<OutlookOAuthAccessTokenResponse, OutlookUserProfile, OutlookMessageObjectFull>;

    public static getProvider(providerType: ACCOUNT_PROVIDER): IEmailProvider;

    public static getProvider(providerType: ACCOUNT_PROVIDER): IEmailProvider<IEmailTAuthToken, IEmailTUserProfile, IEmailTSendEmailResult> {
        let provider = this.providers.get(providerType);
        if (!provider) {
            if (providerType === ACCOUNT_PROVIDER.GMAIL) {
                provider = new GmailProvider();
            } else if (providerType === ACCOUNT_PROVIDER.OUTLOOK) {
                provider = new OutlookProvider();
            } else {
                throw new Error(`Unsupported email provider type: ${providerType}`);
            }
            this.providers.set(providerType, provider);
        }
        return provider;
    }
}
