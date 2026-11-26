import { LOGGER_MODULE } from '@constants';
import { SendTransactionalEmailParams, TRANSACTIONAL_MAILER_PROVIDER } from '@mailsense/types';
import { createLogger } from '@observability';
import { ITransactionalMailer } from '../mailer.types.js';

const logger = createLogger(LOGGER_MODULE.NOOP_MAILER, { forwardToMonitoring: false });

export class NoopMailerProvider implements ITransactionalMailer {
    public readonly name: TRANSACTIONAL_MAILER_PROVIDER = TRANSACTIONAL_MAILER_PROVIDER.NOOP;

    public async sendEmail(params: SendTransactionalEmailParams): Promise<boolean> {
        const recipients = Array.isArray(params.to) ? params.to.join(', ') : params.to;
        logger.info('[NoopMailer] Email delivery suppressed in local/test mode', {
            to: recipients,
            subject: params.subject,
        });
        return true;
    }
}
