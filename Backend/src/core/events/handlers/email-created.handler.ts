import { logger } from '@utils';
import { eventBus } from '../event-bus.js';
import { EmailCreatedPayload, SystemEvent } from '../event.types.js';

export function registerEmailCreatedHandler(): void {
    eventBus.subscribe(SystemEvent.EMAIL_CREATED, async (payload: EmailCreatedPayload) => {
        logger.info(`[Stub Subscriber] New Email Synced: ${payload.email.providerMessageId} for account: ${payload.accountId}`, {
            subject: payload.email.subject,
            from: payload.email.from,
        });

        // NOTE: Future asynchronous pipelines will be triggered here.
        // For example:
        // 1. AI processing (Gemini smart categorizer, suggested replies):
        // await QueueService.addAIProcessingJob({ accountId: payload.accountId, emailId: payload.email.providerMessageId });
        //
        // 2. Notification engine:
        // await NotificationService.sendNewEmailAlert({ accountId: payload.accountId, emailId: payload.email.providerMessageId });
    });
}
