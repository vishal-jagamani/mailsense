import { LOGGER_MODULE } from '@constants';
import { SendTransactionalEmailParams, TRANSACTIONAL_MAILER_PROVIDER } from '@mailsense/types';
import { createLogger } from '@observability';
import { apiRequest } from '@utils';
import { AxiosRequestConfig } from 'axios';
import { MAILER_TIMEOUT_MS, RESEND_API_BASE_URL, RESEND_APIs } from '../mailer.constants.js';
import { ITransactionalMailer, MailerStrategyConfig, ResendEmailRequestPayload } from '../mailer.types.js';

const logger = createLogger(LOGGER_MODULE.RESEND_MAILER, { forwardToMonitoring: false });

export class ResendMailerProvider implements ITransactionalMailer {
    public readonly name: TRANSACTIONAL_MAILER_PROVIDER = TRANSACTIONAL_MAILER_PROVIDER.RESEND;
    private readonly apiKey: string;
    private readonly fromEmail: string;

    constructor(config: MailerStrategyConfig) {
        this.apiKey = config.apiKey ?? '';
        this.fromEmail = config.fromEmail;
    }

    public async sendEmail(params: SendTransactionalEmailParams): Promise<boolean> {
        if (!this.apiKey) {
            logger.warn('ResendMailerProvider skipped: RESEND_API_KEY not configured');
            return false;
        }

        const recipients = Array.isArray(params.to) ? params.to : [params.to];
        const payload: ResendEmailRequestPayload = {
            from: this.fromEmail,
            to: recipients,
            subject: params.subject,
            html: params.html,
            text: params.text,
            ...(params.replyTo ? { reply_to: params.replyTo } : {}),
        };

        try {
            const options: AxiosRequestConfig = {
                url: `${RESEND_API_BASE_URL}${RESEND_APIs.SEND_EMAIL}`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                data: payload,
                timeout: MAILER_TIMEOUT_MS,
            };
            await apiRequest(options);
            logger.info('Transactional email dispatched via Resend', { subject: params.subject, recipientCount: recipients.length });
            return true;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.warn(`Failed to dispatch transactional email via Resend: ${msg}`, { error: msg, subject: params.subject });
            return false;
        }
    }
}
