import { GmailProvider } from '@integrations/gmail/gmail.provider.js';
import { OutlookProvider } from '@integrations/outlook/outlook.provider.js';
import { ACCOUNT_PROVIDER } from '@mailsense/types';
import { EmailProviderFactory } from '../email.provider.factory.js';

describe('EmailProviderFactory', () => {
    it('should return a GmailProvider for GMAIL type', () => {
        const provider = EmailProviderFactory.getProvider(ACCOUNT_PROVIDER.GMAIL);
        expect(provider).toBeInstanceOf(GmailProvider);
    });

    it('should return an OutlookProvider for OUTLOOK type', () => {
        const provider = EmailProviderFactory.getProvider(ACCOUNT_PROVIDER.OUTLOOK);
        expect(provider).toBeInstanceOf(OutlookProvider);
    });

    it('should return the same instance on subsequent calls (Singleton pattern)', () => {
        const provider1 = EmailProviderFactory.getProvider(ACCOUNT_PROVIDER.GMAIL);
        const provider2 = EmailProviderFactory.getProvider(ACCOUNT_PROVIDER.GMAIL);
        expect(provider1).toBe(provider2);
    });

    it('should throw an error for unsupported provider types', () => {
        expect(() => {
            EmailProviderFactory.getProvider('unsupported-provider' as ACCOUNT_PROVIDER);
        }).toThrow('Unsupported email provider type: unsupported-provider');
    });
});
