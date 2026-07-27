import { logger } from '@utils';
import { eventBus } from '../event-bus.js';
import { SYSTEM_EVENT } from '@mailsense/types';

jest.mock('@utils', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}));

describe('EventBus', () => {
    beforeEach(() => {
        eventBus.clearAllListeners();
        jest.clearAllMocks();
    });

    it('should successfully register a subscriber and trigger it when an event is published', async () => {
        const mockHandler = jest.fn();
        eventBus.subscribe(SYSTEM_EVENT.SYNC_COMPLETED, mockHandler);

        const payload = {
            accountId: 'account-123',
            addedEmailsCount: 10,
            deletedEmailsCount: 2,
            startedAt: 1000,
            completedAt: 2500,
        };

        eventBus.publish(SYSTEM_EVENT.SYNC_COMPLETED, payload);

        // Allow microtask queue to flush
        await new Promise((resolve) => setImmediate(resolve));

        expect(mockHandler).toHaveBeenCalledWith(payload);
        expect(logger.info).toHaveBeenCalledWith('📢 Publishing event: sync:completed', expect.objectContaining({ payload }));
    });

    it('should handle errors thrown in event handlers without throwing inside publish', async () => {
        const error = new Error('Database connection failed inside event subscriber');
        const mockHandler = jest.fn().mockRejectedValue(error);

        eventBus.subscribe(SYSTEM_EVENT.EMAIL_CREATED, mockHandler);

        const payload = {
            accountId: 'account-123',
            email: {
                accountId: 'account-123',
                providerMessageId: 'msg-abc',
                threadId: 'thread-xyz',
                from: 'test@sender.com',
                to: ['test@receiver.com'],
                cc: [],
                bcc: [],
                subject: 'Mock Subject',
                body: 'body',
                bodyHtml: '<p>body</p>',
                bodyPlain: 'body',
                receivedAt: new Date(),
                isRead: false,
                folders: ['INBOX'],
            },
        };

        // This should not throw
        expect(() => {
            eventBus.publish(SYSTEM_EVENT.EMAIL_CREATED, payload);
        }).not.toThrow();

        // Allow handler promise execution
        await new Promise((resolve) => setImmediate(resolve));

        expect(mockHandler).toHaveBeenCalledWith(payload);
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('❌ Error executing subscriber for event email:created'),
            expect.objectContaining({ error }),
        );
    });
});
