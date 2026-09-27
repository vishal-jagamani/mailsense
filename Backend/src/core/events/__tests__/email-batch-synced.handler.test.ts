import { EmailBatchSyncedPayload, SYSTEM_EVENT } from '@mailsense/types';
import { createLogger } from '@observability';
import { eventBus } from '../event-bus.js';
import { registerEmailBatchSyncedHandler } from '../handlers/email-batch-synced.handler.js';

jest.mock('@observability', () => {
    const actual = jest.requireActual('@observability') as Record<string, unknown>;
    const loggers: Record<string, { info: jest.Mock; error: jest.Mock; warn: jest.Mock; debug: jest.Mock }> = {};
    return {
        ...actual,
        createLogger: jest.fn((moduleName: string) => {
            if (!loggers[moduleName]) {
                loggers[moduleName] = {
                    info: jest.fn(),
                    error: jest.fn(),
                    warn: jest.fn(),
                    debug: jest.fn(),
                };
            }
            return loggers[moduleName];
        }),
    };
});

describe('EmailBatchSyncedHandler', () => {
    beforeEach(() => {
        eventBus.clearAllListeners();
        jest.clearAllMocks();
    });

    it('should register handler and log ingested batch details when EMAIL_BATCH_SYNCED is published', async () => {
        registerEmailBatchSyncedHandler();

        const payload: EmailBatchSyncedPayload = {
            accountId: 'acc_test_123',
            userId: 'usr_test_456',
            emailIds: ['email_1', 'email_2', 'email_3'],
            batchSize: 3,
            timestamp: Date.now(),
        };

        eventBus.publish(SYSTEM_EVENT.EMAIL_BATCH_SYNCED, payload);

        await new Promise((resolve) => setImmediate(resolve));

        const logger = createLogger('EmailBatchSyncedHandler');
        expect(logger.info).toHaveBeenCalledWith(
            expect.stringContaining('[EmailBatchSyncedHandler] Ingested email batch for account: acc_test_123'),
            expect.objectContaining({
                accountId: 'acc_test_123',
                userId: 'usr_test_456',
                batchSize: 3,
                emailIdsCount: 3,
            }),
        );
    });

    it('should catch and log error if event handler throws', async () => {
        const handlerLogger = createLogger('EmailBatchSyncedHandler');
        jest.spyOn(handlerLogger, 'info')
            .mockImplementationOnce(() => {
                // Registration log
            })
            .mockImplementationOnce(() => {
                // Subscriber execution throw
                throw new Error('Handler processing error');
            });

        registerEmailBatchSyncedHandler();

        const payload: EmailBatchSyncedPayload = {
            accountId: 'acc_fail_123',
            userId: 'usr_fail_456',
            emailIds: ['email_err_1'],
            batchSize: 1,
            timestamp: Date.now(),
        };

        expect(() => {
            eventBus.publish(SYSTEM_EVENT.EMAIL_BATCH_SYNCED, payload);
        }).not.toThrow();

        await new Promise((resolve) => setImmediate(resolve));

        expect(handlerLogger.error).toHaveBeenCalledWith(
            expect.stringContaining('[EmailBatchSyncedHandler] Failed to process email batch sync event'),
            expect.objectContaining({
                accountId: 'acc_fail_123',
                userId: 'usr_fail_456',
                error: 'Handler processing error',
            }),
        );
    });
});
