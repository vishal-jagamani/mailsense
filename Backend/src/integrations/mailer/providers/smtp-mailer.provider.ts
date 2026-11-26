import { LOGGER_MODULE } from '@constants';
import { SendTransactionalEmailParams, TRANSACTIONAL_MAILER_PROVIDER } from '@mailsense/types';
import { createLogger } from '@observability';
import nodemailer, { Transporter } from 'nodemailer';
import { MAILER_TIMEOUT_MS } from '../mailer.constants.js';
import { ITransactionalMailer, MailerStrategyConfig } from '../mailer.types.js';

const logger = createLogger(LOGGER_MODULE.SMTP_MAILER, { forwardToMonitoring: false });

export class SmtpMailerProvider implements ITransactionalMailer {
    public readonly name: TRANSACTIONAL_MAILER_PROVIDER = TRANSACTIONAL_MAILER_PROVIDER.SMTP;
    private readonly transporter: Transporter | null;
    private readonly fromEmail: string;

    constructor(config: MailerStrategyConfig) {
        this.fromEmail = config.fromEmail;
        this.transporter = config.smtpUrl
            ? nodemailer.createTransport({
                  url: config.smtpUrl,
                  connectionTimeout: MAILER_TIMEOUT_MS,
                  socketTimeout: MAILER_TIMEOUT_MS,
              })
            : null;
    }

    public async sendEmail(params: SendTransactionalEmailParams): Promise<boolean> {
        if (!this.transporter) {
            logger.warn('SmtpMailerProvider skipped: SMTP_URL not configured');
            return false;
        }

        try {
            await this.transporter.sendMail({
                from: this.fromEmail,
                to: params.to,
                subject: params.subject,
                html: params.html,
                text: params.text,
                ...(params.replyTo ? { replyTo: params.replyTo } : {}),
            });
            logger.info('Transactional email dispatched via SMTP', { subject: params.subject });
            return true;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.warn(`Failed to dispatch transactional email via SMTP: ${msg}`, { error: msg, subject: params.subject });
            return false;
        }
    }
}
