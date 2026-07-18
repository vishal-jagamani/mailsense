import { GmailProvider } from '@integrations/gmail/gmail.provider.js';
import { GmailMessageObjectFull, GmailUserProfile } from '@integrations/gmail/gmail.types.js';
import { OutlookProvider } from '@integrations/outlook/outlook.provider.js';
import { OutlookMessageObjectFull, OutlookUserProfile } from '@integrations/outlook/outlook.types.js';
import { AccountProvider, GmailOAuthAccessTokenResponse, OutlookOAuthAccessTokenResponse } from '@types';
import { IEmailProvider } from './email.provider.js';
import { IEmailTAuthToken, IEmailTSendEmailResult, IEmailTUserProfile } from './email.provider.types.js';

export class EmailProviderFactory {
    private static providers: Map<AccountProvider, IEmailProvider<IEmailTAuthToken, IEmailTUserProfile, IEmailTSendEmailResult>> = new Map();

    public static getProvider(
        providerType: AccountProvider.GMAIL,
    ): IEmailProvider<GmailOAuthAccessTokenResponse, GmailUserProfile, Partial<GmailMessageObjectFull>>;

    public static getProvider(
        providerType: AccountProvider.OUTLOOK,
    ): IEmailProvider<OutlookOAuthAccessTokenResponse, OutlookUserProfile, OutlookMessageObjectFull>;

    public static getProvider(providerType: AccountProvider): IEmailProvider;

    public static getProvider(providerType: AccountProvider): IEmailProvider<IEmailTAuthToken, IEmailTUserProfile, IEmailTSendEmailResult> {
        let provider = this.providers.get(providerType);
        if (!provider) {
            if (providerType === AccountProvider.GMAIL) {
                provider = new GmailProvider();
            } else if (providerType === AccountProvider.OUTLOOK) {
                provider = new OutlookProvider();
            } else {
                throw new Error(`Unsupported email provider type: ${providerType}`);
            }
            this.providers.set(providerType, provider);
        }
        return provider;
    }
}
