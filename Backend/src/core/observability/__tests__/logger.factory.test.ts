import { LOGGER_MODULE } from '@constants';
import { LOG_LEVELS } from '@types';
import { createLogger, registerTelemetrySink, withTiming } from '../logger.factory.js';

describe('LoggerFactory & APM Telemetry Bridge', () => {
    const mockSink = {
        addBreadcrumb: jest.fn(),
        captureException: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        registerTelemetrySink(mockSink);
    });

    afterAll(() => {
        registerTelemetrySink(null);
    });

    it('should forward info logs to registered telemetry sink as breadcrumbs', () => {
        const testLogger = createLogger('TestService');
        testLogger.info('User session created', { userId: 'usr_123', plan: 'pro' });

        expect(mockSink.addBreadcrumb).toHaveBeenCalledWith({
            category: 'TestService',
            message: 'User session created',
            level: LOG_LEVELS.INFO,
            data: { userId: 'usr_123', plan: 'pro' },
        });
    });

    it('should forward warn logs to registered telemetry sink as breadcrumbs', () => {
        const testLogger = createLogger('RateLimiter');
        testLogger.warn('Rate limit threshold reached', { remaining: 2 });

        expect(mockSink.addBreadcrumb).toHaveBeenCalledWith({
            category: 'RateLimiter',
            message: 'Rate limit threshold reached',
            level: LOG_LEVELS.WARN,
            data: { remaining: 2 },
        });
    });

    it('should forward error logs to registered telemetry sink as exceptions', () => {
        const testLogger = createLogger('PaymentService');
        const originalError = new Error('Card charge failed');
        testLogger.error('Transaction failure', { error: originalError, orderId: 'ord_99' });

        expect(mockSink.captureException).toHaveBeenCalledWith(
            originalError,
            expect.objectContaining({
                tags: { module: 'PaymentService' },
                extra: expect.objectContaining({ orderId: 'ord_99' }),
            }),
        );
    });

    it('should construct an Error when error string or non-Error is passed to error log', () => {
        const testLogger = createLogger('AuthService');
        testLogger.error('Invalid credentials provided', { userId: 'usr_abc' });

        expect(mockSink.captureException).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                tags: { module: 'AuthService' },
            }),
        );
    });

    it('should NOT forward to telemetry sink when forwardToMonitoring is false (recursion guard)', () => {
        const guardedLogger = createLogger('MonitoringInternal', { forwardToMonitoring: false });
        guardedLogger.info('Internal diagnostic check');
        guardedLogger.warn('Internal buffer near capacity');
        guardedLogger.error('Internal connection lost', { error: new Error('Sentry network error') });

        expect(mockSink.addBreadcrumb).not.toHaveBeenCalled();
        expect(mockSink.captureException).not.toHaveBeenCalled();
    });

    it('should measure and log execution duration via withTiming', async () => {
        const timedLogger = createLogger('BenchmarkService');
        const mockFn = jest.fn().mockResolvedValue('success_payload');

        const result = await withTiming(timedLogger, 'FetchEmailsBatch', mockFn);

        expect(result).toBe('success_payload');
        expect(mockSink.addBreadcrumb).toHaveBeenCalledWith(
            expect.objectContaining({
                category: 'BenchmarkService',
                message: 'FetchEmailsBatch completed successfully',
                level: LOG_LEVELS.INFO,
            }),
        );
    });

    it('should log failure duration and re-throw on error in withTiming', async () => {
        const timedLogger = createLogger('FailingBenchmarkService');
        const testError = new Error('Database query timed out');
        const mockFn = jest.fn().mockRejectedValue(testError);

        await expect(withTiming(timedLogger, 'FailedBatch', mockFn)).rejects.toThrow('Database query timed out');

        expect(mockSink.captureException).toHaveBeenCalledWith(
            testError,
            expect.objectContaining({
                tags: { module: 'FailingBenchmarkService' },
            }),
        );
    });

    it('should support LoggerModule enum as moduleName parameter', () => {
        const enumLogger = createLogger(LOGGER_MODULE.OBJECT_STORAGE_SERVICE);
        enumLogger.info('Object storage operation succeeded', { bucket: 'mailsense-attachments' });

        expect(mockSink.addBreadcrumb).toHaveBeenCalledWith({
            category: LOGGER_MODULE.OBJECT_STORAGE_SERVICE,
            message: 'Object storage operation succeeded',
            level: LOG_LEVELS.INFO,
            data: { bucket: 'mailsense-attachments' },
        });
    });
});
