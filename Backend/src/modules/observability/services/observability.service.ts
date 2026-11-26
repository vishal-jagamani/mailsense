import { ALERTING_CONFIG, APP_VERSION, NODE_ENV } from '@config';
import { LOGGER_MODULE } from '@constants';
import { MailerFactory } from '@integrations/mailer/mailer.factory.js';
import { ERROR_LOG_SEVERITY, ERROR_LOG_SOURCE, ReportClientErrorPayload } from '@mailsense/types';
import { createLogger, getTraceId } from '@observability';
import { getRedisConnection } from '@queue';
import crypto from 'node:crypto';
import { ALERT_EMAIL_HTML, ALERT_EMAIL_TEXT } from '../constants/index.js';
import { ErrorLogDocument, ErrorLogRepository } from '../database/index.js';
import { ErrorLogInput, RecordClientErrorResult, RecordSystemErrorInput } from '../types/index.js';
import * as ObservabilityUtils from '../utils/index.js';

const logger = createLogger(LOGGER_MODULE.OBSERVABILITY_SERVICE, { forwardToMonitoring: false });

const MAX_STACK_LENGTH = 4000;
const MAX_FALLBACK_MAP_SIZE = 500;

export class ObservabilityService {
    private readonly memoryCooldowns = new Map<string, number>();

    public async recordAndAlertError(input: RecordSystemErrorInput): Promise<ErrorLogDocument | null> {
        try {
            const sanitizedMessage = input.message.slice(0, 1000);
            const fingerprint = ObservabilityUtils.computeFingerprint(input.source, input.module, input.errorCode, sanitizedMessage);

            const logData = this.prepareErrorLogInput(input, sanitizedMessage, fingerprint);

            const persisted = await ErrorLogRepository.upsertErrorLog(logData);

            if (this.shouldSendAlertEmail(input.severity)) {
                const canAlert = await this.acquireAlertCooldown(fingerprint);
                if (canAlert) {
                    await this.dispatchAlertEmail(persisted);
                }
            }

            return persisted;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logger.warn(`Non-blocking error persistence failure: ${msg}`);
            return null;
        }
    }

    private prepareErrorLogInput(input: RecordSystemErrorInput, sanitizedMessage: string, fingerprint: string): ErrorLogInput {
        const sanitizedContext = ObservabilityUtils.sanitizeContext(input.context);
        const sanitizedStack = input.stack ? input.stack.slice(0, MAX_STACK_LENGTH) : undefined;
        return {
            traceId: input.traceId || getTraceId() || undefined,
            fingerprint,
            source: input.source,
            severity: input.severity,
            module: input.module,
            errorCode: input.errorCode,
            httpStatus: input.httpStatus,
            message: sanitizedMessage,
            stack: sanitizedStack,
            context: sanitizedContext,
            environment: NODE_ENV || 'development',
            appVersion: APP_VERSION,
            lastOccurredAt: Date.now(),
        };
    }

    public async recordClientError(payload: ReportClientErrorPayload, userId?: string, userAgent?: string): Promise<RecordClientErrorResult> {
        const traceId = payload.traceId || getTraceId() || crypto.randomUUID();
        const combinedStack = [payload.stack, payload.componentStack].filter(Boolean).join('\n--- Component Stack ---\n');

        const persisted = await this.recordAndAlertError({
            source: ERROR_LOG_SOURCE.FRONTEND_CLIENT,
            severity: ERROR_LOG_SEVERITY.ERROR,
            module: 'FrontendClientBoundary',
            errorCode: 'FRONTEND_RUNTIME_CRASH',
            message: payload.message,
            stack: combinedStack || undefined,
            traceId,
            context: {
                userId,
                pageUrl: payload.pageUrl,
                userAgent,
                extra: { clientAppVersion: payload.appVersion },
            },
        });

        return { logged: Boolean(persisted), traceId };
    }

    private shouldSendAlertEmail(severity: ERROR_LOG_SEVERITY): boolean {
        if (!ALERTING_CONFIG.enabled || !ALERTING_CONFIG.adminAlertEmail) {
            return false;
        }
        return severity === ERROR_LOG_SEVERITY.ERROR || severity === ERROR_LOG_SEVERITY.CRITICAL;
    }

    private async acquireAlertCooldown(fingerprint: string): Promise<boolean> {
        const cooldownSeconds = ALERTING_CONFIG.cooldownSeconds;
        const key = `alert:cooldown:${fingerprint}`;

        try {
            const redis = getRedisConnection();
            const status = await redis.set(key, '1', 'EX', cooldownSeconds, 'NX');
            return status === 'OK';
        } catch {
            // Redis fallback cooldown map prevents alert storms during Redis outage
            const now = Date.now();
            const expiresAt = this.memoryCooldowns.get(fingerprint);
            if (expiresAt && expiresAt > now) {
                return false;
            }
            if (this.memoryCooldowns.size >= MAX_FALLBACK_MAP_SIZE) {
                this.memoryCooldowns.clear();
            }
            this.memoryCooldowns.set(fingerprint, now + cooldownSeconds * 1000);
            return true;
        }
    }

    private async dispatchAlertEmail(doc: ErrorLogDocument): Promise<void> {
        const adminEmail = ALERTING_CONFIG.adminAlertEmail;
        if (!adminEmail) return;

        const mailer = MailerFactory.getMailer();
        const subject = `[MailSense ${doc.environment.toUpperCase()}] [${doc.severity}] ${doc.module}: ${doc.errorCode}`;

        await mailer.sendEmail({ to: adminEmail, subject, text: ALERT_EMAIL_TEXT(doc), html: ALERT_EMAIL_HTML(doc) });
    }
}
