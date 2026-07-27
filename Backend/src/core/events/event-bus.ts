import { SYSTEM_EVENT, SystemEventPayloads } from '@mailsense/types';
import { logger } from '@utils';
import EventEmitter from 'events';

class EventBus {
    private emitter = new EventEmitter();

    constructor() {
        // Safe limit for concurrent listeners to prevent memory warnings
        this.emitter.setMaxListeners(20);
    }

    /**
     * Publish a system event with a strongly-typed payload
     */
    public publish<K extends SYSTEM_EVENT>(event: K, payload: SystemEventPayloads[K]): void {
        const summary = this.getPayloadSummary(event, payload);
        logger.info(`📢 Publishing event: ${event}`, { payload: summary });
        this.emitter.emit(event, payload);
    }

    /**
     * Subscribe to a system event with a strongly-typed payload handler
     */
    public subscribe<K extends SYSTEM_EVENT>(event: K, handler: (payload: SystemEventPayloads[K]) => void | Promise<void>): void {
        this.emitter.on(event, async (payload: SystemEventPayloads[K]) => {
            try {
                await handler(payload);
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                logger.error(`❌ Error executing subscriber for event ${event}: ${msg}`, { error });
            }
        });
    }

    /**
     * Clear all event listeners (mainly used in testing)
     */
    public clearAllListeners(): void {
        this.emitter.removeAllListeners();
    }

    /**
     * Helper to sanitize and summarize payloads for safe logging
     */
    private getPayloadSummary<K extends SYSTEM_EVENT>(
        event: K,
        payload: SystemEventPayloads[K],
    ): SystemEventPayloads[SYSTEM_EVENT.SYNC_COMPLETED] | { accountId: string; providerMessageId?: string; subject?: string } {
        if (event === SYSTEM_EVENT.EMAIL_CREATED) {
            const emailPayload = payload as SystemEventPayloads[SYSTEM_EVENT.EMAIL_CREATED];
            return {
                accountId: emailPayload.accountId,
                providerMessageId: emailPayload.email?.providerMessageId,
                subject: emailPayload.email?.subject,
            };
        }
        return payload as SystemEventPayloads[SYSTEM_EVENT.SYNC_COMPLETED];
    }
}

export const eventBus = new EventBus();
