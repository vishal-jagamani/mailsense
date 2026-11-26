import { SendTransactionalEmailParams, TRANSACTIONAL_MAILER_PROVIDER } from '@mailsense/types';

export interface ITransactionalMailer {
    readonly name: TRANSACTIONAL_MAILER_PROVIDER;
    sendEmail(params: SendTransactionalEmailParams): Promise<boolean>;
}

export interface MailerStrategyConfig {
    apiKey?: string;
    smtpUrl?: string;
    fromEmail: string;
}

export interface ResendEmailRequestPayload {
    from: string;
    to: string[];
    subject: string;
    html: string;
    text: string;
    reply_to?: string;
}
