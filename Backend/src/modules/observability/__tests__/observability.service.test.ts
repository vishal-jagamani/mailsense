import { MailerFactory } from '@integrations/mailer/mailer.factory.js';
import { ERROR_LOG_SEVERITY, ERROR_LOG_SOURCE } from '@mailsense/types';
import { getRedisConnection } from '@queue';
import { ErrorLogRepository } from '../database/index.js';
import { ObservabilityService } from '../services/observability.service.js';

const mockSendEmail = jest.fn();

jest.mock('@config', () => ({
    APP_VERSION: '3.8.0',
    NODE_ENV: 'test',
    ALERTING_CONFIG: {
        enabled: true,
        adminAlertEmail: 'admin@mailsense.app',
        supportEmail: 'support@mailsense.app',
        cooldownSeconds: 900,
    },
}));

jest.mock('@queue', () => ({
    getRedisConnection: jest.fn(),
}));

jest.mock('@integrations/mailer/mailer.factory.js', () => ({
    MailerFactory: {
        getMailer: jest.fn(),
    },
}));

jest.mock('../database/index.js', () => ({
    ErrorLogRepository: {
        upsertErrorLog: jest.fn(),
        countUnresolved: jest.fn(),
    },
}));

describe('ObservabilityService', () => {
    let service: ObservabilityService;
    const mockRedisSet = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ObservabilityService();
        (getRedisConnection as jest.Mock).mockReturnValue({ set: mockRedisSet });
        (MailerFactory.getMailer as jest.Mock).mockReturnValue({ sendEmail: mockSendEmail });
        mockSendEmail.mockResolvedValue(true);
    });

    it('upserts sanitized ErrorLog and sends only one email per cooldown window', async () => {
        const persistedDoc = {
            source: ERROR_LOG_SOURCE.BACKEND_API,
            severity: ERROR_LOG_SEVERITY.CRITICAL,
            module: 'Server',
            errorCode: 'INTERNAL_ERROR',
            httpStatus: 500,
            message: 'Database timeout on user 656f1234567890abcdef1234',
            environment: 'test',
            appVersion: '3.8.0',
            occurrenceCount: 1,
            traceId: 'trace-123',
        };
        (ErrorLogRepository.upsertErrorLog as jest.Mock).mockResolvedValue(persistedDoc);
        mockRedisSet.mockResolvedValueOnce('OK').mockResolvedValueOnce(null);

        await service.recordAndAlertError({
            source: ERROR_LOG_SOURCE.BACKEND_API,
            severity: ERROR_LOG_SEVERITY.CRITICAL,
            module: 'Server',
            errorCode: 'INTERNAL_ERROR',
            httpStatus: 500,
            message: 'Database timeout on user 656f1234567890abcdef1234',
            context: {
                userId: 'user-1',
                extra: {
                    accessToken: 'secret-oauth-token',
                    route: '/api/emails/list',
                },
            },
        });

        await service.recordAndAlertError({
            source: ERROR_LOG_SOURCE.BACKEND_API,
            severity: ERROR_LOG_SEVERITY.CRITICAL,
            module: 'Server',
            errorCode: 'INTERNAL_ERROR',
            httpStatus: 500,
            message: 'Database timeout on user 656f1234567890abcdef9999',
        });

        const firstCallArg = (ErrorLogRepository.upsertErrorLog as jest.Mock).mock.calls[0][0];
        const secondCallArg = (ErrorLogRepository.upsertErrorLog as jest.Mock).mock.calls[1][0];
        expect(firstCallArg.fingerprint).toBe(secondCallArg.fingerprint);
        expect(firstCallArg.context.extra.accessToken).toBe('[REDACTED]');
        expect(firstCallArg.context.extra.route).toBe('/api/emails/list');
        expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });

    it('falls back to in-memory cooldown map when Redis fails', async () => {
        const persistedDoc = {
            source: ERROR_LOG_SOURCE.BACKEND_WORKER,
            severity: ERROR_LOG_SEVERITY.ERROR,
            module: 'sync-account',
            errorCode: 'WORKER_JOB_FAILED',
            message: 'Socket hang up',
            environment: 'test',
            appVersion: '3.8.0',
            occurrenceCount: 1,
        };
        (ErrorLogRepository.upsertErrorLog as jest.Mock).mockResolvedValue(persistedDoc);
        (getRedisConnection as jest.Mock).mockImplementation(() => {
            throw new Error('Redis unavailable');
        });

        await service.recordAndAlertError({
            source: ERROR_LOG_SOURCE.BACKEND_WORKER,
            severity: ERROR_LOG_SEVERITY.ERROR,
            module: 'sync-account',
            errorCode: 'WORKER_JOB_FAILED',
            message: 'Socket hang up',
        });

        await service.recordAndAlertError({
            source: ERROR_LOG_SOURCE.BACKEND_WORKER,
            severity: ERROR_LOG_SEVERITY.ERROR,
            module: 'sync-account',
            errorCode: 'WORKER_JOB_FAILED',
            message: 'Socket hang up',
        });

        expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });

    it('fails gracefully and returns null when MongoDB upsert throws', async () => {
        (ErrorLogRepository.upsertErrorLog as jest.Mock).mockRejectedValue(new Error('Mongo write failed'));

        const result = await service.recordAndAlertError({
            source: ERROR_LOG_SOURCE.BACKEND_API,
            severity: ERROR_LOG_SEVERITY.ERROR,
            module: 'Server',
            errorCode: 'INTERNAL_ERROR',
            message: 'Something broke',
        });

        expect(result).toBeNull();
        expect(mockSendEmail).not.toHaveBeenCalled();
    });
});
