import { TRANSACTIONAL_MAILER_PROVIDER } from '@mailsense/types';
import { apiRequest } from '@utils';
import { MAILER_TIMEOUT_MS, RESEND_API_BASE_URL, RESEND_APIs } from '../mailer.constants.js';
import { MailerFactory } from '../mailer.factory.js';
import { NoopMailerProvider } from '../providers/noop-mailer.provider.js';
import { ResendMailerProvider } from '../providers/resend-mailer.provider.js';
import { SmtpMailerProvider } from '../providers/smtp-mailer.provider.js';

jest.mock('@utils', () => ({
    apiRequest: jest.fn(),
}));

describe('MailerFactory & Providers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        MailerFactory.resetMailer();
    });

    it('defaults to NoopMailerProvider in test environment', () => {
        const mailer = MailerFactory.getMailer();
        expect(mailer).toBeInstanceOf(NoopMailerProvider);
        expect(mailer.name).toBe(TRANSACTIONAL_MAILER_PROVIDER.NOOP);
    });

    it('returns cached singleton on subsequent getMailer() calls and resets on resetMailer()', () => {
        const first = MailerFactory.getMailer();
        const second = MailerFactory.getMailer();
        expect(first).toBe(second);

        MailerFactory.resetMailer();
        const third = MailerFactory.getMailer();
        expect(third).not.toBe(first);
    });

    it('resolves ResendMailerProvider when API key is provided and falls back to Noop when missing', () => {
        const resend = MailerFactory.createMailer(TRANSACTIONAL_MAILER_PROVIDER.RESEND, {
            apiKey: 're_test_key',
            fromEmail: 'alerts@mailsense.app',
        });
        expect(resend).toBeInstanceOf(ResendMailerProvider);

        const fallback = MailerFactory.createMailer(TRANSACTIONAL_MAILER_PROVIDER.RESEND, {
            fromEmail: 'alerts@mailsense.app',
        });
        expect(fallback).toBeInstanceOf(NoopMailerProvider);
    });

    it('resolves SmtpMailerProvider when smtpUrl is provided and falls back to Noop when missing', () => {
        const smtp = MailerFactory.createMailer(TRANSACTIONAL_MAILER_PROVIDER.SMTP, {
            smtpUrl: 'smtps://user:pass@smtp.example.com:465',
            fromEmail: 'alerts@mailsense.app',
        });
        expect(smtp).toBeInstanceOf(SmtpMailerProvider);

        const fallback = MailerFactory.createMailer(TRANSACTIONAL_MAILER_PROVIDER.SMTP, {
            fromEmail: 'alerts@mailsense.app',
        });
        expect(fallback).toBeInstanceOf(NoopMailerProvider);
    });

    it('dispatches formatted email payload via Resend API client', async () => {
        (apiRequest as jest.Mock).mockResolvedValue({ data: { id: 'msg_123' } });

        const provider = new ResendMailerProvider({
            apiKey: 're_test_123',
            fromEmail: 'MailSense Alerts <alerts@mailsense.app>',
        });

        const delivered = await provider.sendEmail({
            to: 'admin@mailsense.app',
            subject: '[CRITICAL] Error Alert',
            text: 'Plain alert text',
            html: '<p>Alert HTML</p>',
            replyTo: 'support@mailsense.app',
        });

        expect(delivered).toBe(true);
        expect(apiRequest).toHaveBeenCalledWith({
            url: `${RESEND_API_BASE_URL}${RESEND_APIs.SEND_EMAIL}`,
            method: 'POST',
            headers: {
                Authorization: 'Bearer re_test_123',
                'Content-Type': 'application/json',
            },
            data: {
                from: 'MailSense Alerts <alerts@mailsense.app>',
                to: ['admin@mailsense.app'],
                subject: '[CRITICAL] Error Alert',
                html: '<p>Alert HTML</p>',
                text: 'Plain alert text',
                reply_to: 'support@mailsense.app',
            },
            timeout: MAILER_TIMEOUT_MS,
        });
    });

    it('returns false without throwing when Resend API request fails', async () => {
        (apiRequest as jest.Mock).mockRejectedValue(new Error('Network timeout'));

        const provider = new ResendMailerProvider({
            apiKey: 're_test_123',
            fromEmail: 'alerts@mailsense.app',
        });

        const delivered = await provider.sendEmail({
            to: 'admin@mailsense.app',
            subject: 'Alert',
            text: 'Text',
            html: '<p>HTML</p>',
        });

        expect(delivered).toBe(false);
    });
});
