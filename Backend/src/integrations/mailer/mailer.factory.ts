import { MAILER_CONFIG, NODE_ENV } from '@config';
import { LOGGER_MODULE } from '@constants';
import { TRANSACTIONAL_MAILER_PROVIDER } from '@mailsense/types';
import { createLogger } from '@observability';
import { ITransactionalMailer, MailerStrategyConfig } from './mailer.types.js';
import { NoopMailerProvider } from './providers/noop-mailer.provider.js';
import { ResendMailerProvider } from './providers/resend-mailer.provider.js';
import { SmtpMailerProvider } from './providers/smtp-mailer.provider.js';

const logger = createLogger(LOGGER_MODULE.MAILER_FACTORY, { forwardToMonitoring: false });

export class MailerFactory {
    private static instance: ITransactionalMailer | null = null;

    public static getMailer(): ITransactionalMailer {
        if (MailerFactory.instance) {
            return MailerFactory.instance;
        }

        if (NODE_ENV === 'test') {
            MailerFactory.instance = new NoopMailerProvider();
            return MailerFactory.instance;
        }

        const strategyConfig: MailerStrategyConfig = {
            apiKey: MAILER_CONFIG.resendApiKey,
            smtpUrl: MAILER_CONFIG.smtpUrl,
            fromEmail: MAILER_CONFIG.fromEmail,
        };

        MailerFactory.instance = MailerFactory.createMailer(MAILER_CONFIG.provider, strategyConfig);
        logger.info(`Transactional mailer initialized: [${MailerFactory.instance.name}]`);
        return MailerFactory.instance;
    }

    public static createMailer(providerName: string, config: MailerStrategyConfig): ITransactionalMailer {
        const normalized = providerName.toUpperCase();
        switch (normalized) {
            case TRANSACTIONAL_MAILER_PROVIDER.RESEND:
                if (config.apiKey) {
                    return new ResendMailerProvider(config);
                }
                break;
            case TRANSACTIONAL_MAILER_PROVIDER.SMTP:
                if (config.smtpUrl) {
                    return new SmtpMailerProvider(config);
                }
                break;
            case TRANSACTIONAL_MAILER_PROVIDER.NOOP:
                return new NoopMailerProvider();
        }

        logger.warn(`Requested mailer [${normalized}] lacks credentials or is unrecognized. Falling back to NoopMailerProvider.`);
        return new NoopMailerProvider();
    }

    public static resetMailer(): void {
        MailerFactory.instance = null;
    }
}
