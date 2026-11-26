import { AI_CONFIG } from '@config';
import { LOGGER_MODULE } from '@constants';
import { AppError, ForbiddenError, NotFoundError } from '@errors';
import { AiProviderFactory } from '@integrations/ai/ai.provider.factory.js';
import { IAiProvider } from '@integrations/ai/ai.provider.js';
import {
    AI_JOB_STATUS,
    AI_OPERATION_TYPE,
    AiSuggestedRepliesParams,
    AiSummarizeThreadParams,
    AiThreadMessageInput,
    GetEmailSummaryResponse,
    GetSuggestedRepliesResponse,
} from '@mailsense/types';
import { AccountRepository } from '@modules/accounts/database/account.repository.js';
import { EmailDocument, EmailRepository } from '@modules/emails/database/index.js';
import { createLogger, getTraceId } from '@observability';
import { CaughtError } from '@types';
import { decompressString } from '@utils';
import { AI_MODULE_CONSTANTS } from '../constants/ai.constants.js';
import { AiJobRepository } from '../database/index.js';
import { OnDemandAiTelemetryContext, OnDemandAiTelemetryParams, SuggestedRepliesTelemetryBundle } from '../types/index.js';

const logger = createLogger(LOGGER_MODULE.AI_SERVICE);

export class AIService {
    // Generates an executive summary, key bullet points, and action items for an email thread.
    public async summarizeThread(userId: string, emailId: string): Promise<GetEmailSummaryResponse> {
        const startedAt = Date.now();
        logger.info('Initiating on-demand thread summarization', { userId, emailId });

        // 1. Retrieve target email and verify ownership
        const email = await this.resolveAndAuthorizeEmail(userId, emailId);

        // 2. Retrieve all emails in the conversation thread
        const threadEmails = await EmailRepository.getEmailsByThreadId(email.threadId, email.accountId);
        if (!threadEmails || threadEmails.length === 0) {
            throw new NotFoundError('Email thread', email.threadId);
        }

        // 3. Assemble and decompress thread messages in chronological order
        const messages: AiThreadMessageInput[] = threadEmails.map((msg) => ({
            from: msg.from,
            date: msg.receivedAt,
            bodyPlain: decompressString(msg.bodyPlain),
        }));

        // 4. Delegate to configured AI Provider Strategy
        const provider = AiProviderFactory.getProvider();

        const telemetryContext: OnDemandAiTelemetryContext = {
            userId,
            accountId: email.accountId,
            emailId: String(email._id),
            operationType: AI_OPERATION_TYPE.ON_DEMAND_SUMMARY,
            provider: provider.name,
            startedAt,
        };
        const params: AiSummarizeThreadParams = { threadSubject: email.subject, messages };

        try {
            const result = await provider.summarizeEmailThread(params);
            const completedAt = Date.now();

            await this.recordOnDemandAiJob({
                ...telemetryContext,
                status: AI_JOB_STATUS.COMPLETED,
                modelName: result.modelName ?? AI_CONFIG.geminiModel,
                completedAt,
                tokenUsage: result.tokenUsage,
                traceId: getTraceId() || undefined,
            });

            return {
                emailId: email._id,
                summary: result.summary,
                keyPoints: result.keyPoints,
                actionItems: result.actionItems,
                generatedAt: completedAt,
            };
        } catch (error) {
            const caughtError: CaughtError = error instanceof Error || typeof error === 'string' ? error : String(error);
            await this.recordFailedOnDemandAiJob(caughtError, telemetryContext);
            throw error;
        }
    }

    public async getSuggestedReplies(userId: string, emailId: string): Promise<GetSuggestedRepliesResponse> {
        const startedAt = Date.now();
        logger.info('Initiating suggested replies generation', { userId, emailId });

        const email = await this.resolveAndAuthorizeEmail(userId, emailId);
        const threadEmails = await EmailRepository.getEmailsByThreadId(email.threadId, email.accountId);
        const priorMessages = threadEmails
            .filter((m) => String(m._id) !== emailId)
            .slice(-AI_MODULE_CONSTANTS.MAX_RECENT_THREAD_CONTEXT_MESSAGES)
            .map((m) => ({
                from: m.from,
                date: m.receivedAt,
                bodyPlain: decompressString(m.bodyPlain),
            }));

        const provider = AiProviderFactory.getProvider();

        const { telemetryContext, params } = this.resolveTelemetryContextAndAiSuggestedRepliesParams(
            userId,
            email,
            provider,
            startedAt,
            priorMessages,
        );

        try {
            const result = await provider.generateSuggestedReplies(params);
            const completedAt = Date.now();

            await this.recordOnDemandAiJob({
                ...telemetryContext,
                status: AI_JOB_STATUS.COMPLETED,
                modelName: result.modelName ?? AI_CONFIG.geminiModel,
                completedAt,
                tokenUsage: result.tokenUsage,
                traceId: getTraceId() || undefined,
            });

            return {
                emailId,
                suggestions: result.suggestions,
                generatedAt: completedAt,
            };
        } catch (error) {
            const caughtError: CaughtError = error instanceof Error || typeof error === 'string' ? error : String(error);
            await this.recordFailedOnDemandAiJob(caughtError, telemetryContext);
            throw error;
        }
    }

    private resolveTelemetryContextAndAiSuggestedRepliesParams(
        userId: string,
        email: EmailDocument,
        provider: IAiProvider,
        startedAt: number,
        priorMessages: AiThreadMessageInput[],
    ): SuggestedRepliesTelemetryBundle {
        const telemetryContext: OnDemandAiTelemetryContext = {
            userId,
            accountId: email.accountId,
            emailId: String(email._id),
            operationType: AI_OPERATION_TYPE.ON_DEMAND_SUGGESTIONS,
            provider: provider.name,
            startedAt,
        };
        const params: AiSuggestedRepliesParams = {
            subject: email.subject,
            from: email.from,
            to: email.to,
            bodyPlain: decompressString(email.bodyPlain),
            receivedAt: email.receivedAt,
            recentMessages: priorMessages.length > 0 ? priorMessages : undefined,
        };

        return { telemetryContext, params };
    }

    private async recordFailedOnDemandAiJob(error: CaughtError, context: OnDemandAiTelemetryContext): Promise<void> {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = error instanceof AppError ? error.errorCode : 'AI_ON_DEMAND_FAILED';
        await this.recordOnDemandAiJob({
            ...context,
            status: AI_JOB_STATUS.FAILED,
            modelName: AI_CONFIG.geminiModel,
            completedAt: Date.now(),
            errorMessage,
            errorCode,
            traceId: getTraceId() || undefined,
        });
    }

    private async recordOnDemandAiJob(params: OnDemandAiTelemetryParams): Promise<void> {
        try {
            await AiJobRepository.createOnDemandJob({
                userId: params.userId,
                accountId: params.accountId,
                emailId: params.emailId,
                operationType: params.operationType,
                status: params.status,
                provider: params.provider,
                modelName: params.modelName,
                startedAt: params.startedAt,
                completedAt: params.completedAt,
                processingDurationMs: Math.max(0, params.completedAt - params.startedAt),
                tokenUsage: params.tokenUsage ?? { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
                errorMessage: params.errorMessage,
                errorCode: params.errorCode,
                attemptCount: 1,
                traceId: params.traceId,
            });
        } catch (persistError) {
            const msg = persistError instanceof Error ? persistError.message : String(persistError);
            logger.warn(`Failed to record on-demand AiJob telemetry cleanly: ${msg}`);
        }
    }

    private async resolveAndAuthorizeEmail(userId: string, emailId: string): Promise<EmailDocument> {
        const email = await EmailRepository.getEmail(emailId);
        if (!email) {
            throw new NotFoundError('Email', emailId);
        }

        const account = await AccountRepository.getAccountById(email.accountId);
        if (!account || account.userId.toString() !== userId.toString()) {
            logger.warn('Forbidden cross-tenant access attempt to email', {
                userId,
                emailId,
                emailAccountId: email.accountId,
            });
            throw new ForbiddenError('Unauthorized attempt to access email');
        }

        return email;
    }
}
