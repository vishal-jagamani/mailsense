import { LOGGER_MODULE } from '@constants';
import { RateLimitError } from '@errors';
import { AiProviderFactory } from '@integrations/ai/ai.provider.factory.js';
import { AI_PROCESSING_STATUS, AIProcessingJobPayload, AIProcessingJobResult, EmailAiMetadata } from '@mailsense/types';
import { EmailDocument } from '@modules/emails/database/email.model.js';
import { EmailRepository } from '@modules/emails/database/email.repository.js';
import { UserSettingsRepository } from '@modules/user/database/user-settings.repository.js';
import { createLogger } from '@observability';
import { getQueue, QUEUE_NAMES } from '@queue';
import { Job } from 'bullmq';

const logger = createLogger(LOGGER_MODULE.AI_PROCESSING_PROCESSOR);

const checkUserPrivacyAndAISettings = async (
    userId: string,
    accountId: string,
    emailId: string,
    startTime: number,
): Promise<AIProcessingJobResult | null> => {
    const userAiSettings = await UserSettingsRepository.getAiSettings(userId);
    if (userAiSettings) {
        if (!userAiSettings.enabled) {
            logger.info('AI processing skipped: AI disabled globally by user preferences', { userId, emailId });
            return {
                emailId,
                status: AI_PROCESSING_STATUS.SKIPPED,
                hasSummary: false,
                processingDurationMs: Date.now() - startTime,
                skippedReason: 'AI disabled globally by user preferences',
            };
        }

        if (userAiSettings.disabledAccountIds?.includes(accountId)) {
            logger.info('AI processing skipped: AI disabled for this specific account', { accountId, emailId });
            return {
                emailId,
                status: AI_PROCESSING_STATUS.SKIPPED,
                hasSummary: false,
                processingDurationMs: Date.now() - startTime,
                skippedReason: 'AI disabled for account',
            };
        }
    }
    return null;
};

const executeAIProcessingAndStoreAiMetadata = async (
    accountId: string,
    emailId: string,
    email: EmailDocument,
    startTime: number,
): Promise<AIProcessingJobResult> => {
    const provider = AiProviderFactory.getProvider();
    const classification = await provider.classifyAndScoreEmail({
        subject: email.subject,
        from: email.from,
        to: email.to,
        bodyPlain: email.bodyPlain,
        receivedAt: email.receivedAt,
    });

    const metadata: EmailAiMetadata = {
        category: classification.category,
        priority: classification.priority,
        summary: classification.summary,
        tags: classification.tags,
        confidence: classification.confidence,
        processedAt: new Date(),
        provider: provider.name,
    };

    await EmailRepository.updateEmailAiMetadata(emailId, accountId, metadata);

    const durationMs = Date.now() - startTime;
    logger.info('Email AI classification completed and persisted successfully', {
        emailId,
        category: classification.category,
        priority: classification.priority,
        durationMs,
    });

    return {
        emailId,
        status: AI_PROCESSING_STATUS.SUCCESS,
        category: classification.category,
        priority: classification.priority,
        hasSummary: Boolean(classification.summary),
        processingDurationMs: durationMs,
    };
};

const handleAIProcessingError = async (error: unknown, emailId: string, durationMs: number): Promise<AIProcessingJobResult> => {
    // Catch 429 Rate Limit from Gemini and trigger BullMQ native backoff
    if (error instanceof RateLimitError) {
        const retryAfterMs = error.retryAfterMs ?? 10000;
        logger.warn(`Gemini rate limit exceeded. Pausing queue via queue.rateLimit for ${retryAfterMs}ms`, {
            emailId,
            retryAfterMs,
        });
        try {
            const queue = getQueue(QUEUE_NAMES.AI_PROCESSING);
            await queue.rateLimit(retryAfterMs);
        } catch (err) {
            logger.warn('Failed to pause queue rateLimit', { err });
        }
        return {
            emailId,
            status: AI_PROCESSING_STATUS.RATE_LIMITED,
            hasSummary: false,
            processingDurationMs: durationMs,
            skippedReason: `Rate limit hit, delayed for ${retryAfterMs}ms`,
        };
    }

    const message = error instanceof Error ? error.message : String(error);
    logger.error(`AI processing processor failed for email: ${emailId}`, {
        error: message,
        durationMs,
    });

    return {
        emailId,
        status: AI_PROCESSING_STATUS.FAILED,
        hasSummary: false,
        processingDurationMs: durationMs,
        skippedReason: message,
    };
};

export const aiProcessingProcessor = async (job: Job<AIProcessingJobPayload, AIProcessingJobResult>): Promise<AIProcessingJobResult> => {
    const startTime = Date.now();
    const { emailId, accountId, userId, forceReprocess } = job.data;

    logger.info('Processing AI classification job for email', {
        jobId: job.id,
        emailId,
        accountId,
        userId,
    });

    // 1. User Privacy & AI Settings Check
    const privacyCheckResult = await checkUserPrivacyAndAISettings(userId, accountId, emailId, startTime);
    if (privacyCheckResult) {
        return privacyCheckResult;
    }

    // 2. Retrieve Email Document
    const email = await EmailRepository.getEmail(emailId);
    if (!email) {
        logger.warn('Email document not found for AI processing job; skipping', {
            emailId,
            accountId,
        });
        return {
            emailId,
            status: AI_PROCESSING_STATUS.SKIPPED,
            hasSummary: false,
            processingDurationMs: Date.now() - startTime,
            skippedReason: 'Email document not found',
        };
    }

    // 3. Idempotency Check: Skip if already processed and forceReprocess is false
    if (email.aiProcessedAt && !forceReprocess) {
        logger.info('Email already processed by AI; skipping redundant classification', { emailId });
        return {
            emailId,
            status: AI_PROCESSING_STATUS.SKIPPED,
            category: email.aiCategory,
            priority: email.aiPriority,
            hasSummary: Boolean(email.aiSummary),
            processingDurationMs: Date.now() - startTime,
            skippedReason: 'Email already classified',
        };
    }

    // 4. Execute AI Strategy via Provider Factory and store the ai metadata
    try {
        const result = await executeAIProcessingAndStoreAiMetadata(accountId, emailId, email, startTime);
        return result;
    } catch (error) {
        return await handleAIProcessingError(error, emailId, Date.now() - startTime);
    }
};
