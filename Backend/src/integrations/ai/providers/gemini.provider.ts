import { AI_CONFIG } from '@config';
import { LOGGER_MODULE } from '@constants';
import { AiProcessingError, AppError, ConfigurationError, RateLimitError } from '@errors';
import { GenerateContentResponseUsageMetadata, GoogleGenAI } from '@google/genai';
import {
    AI_PROVIDER_NAME,
    AiClassifyEmailParams,
    AiClassifyEmailResult,
    AiSuggestedRepliesParams,
    AiSuggestedRepliesResult,
    AiSummarizeThreadParams,
    AiSummarizeThreadResult,
    AiTokenUsage,
} from '@mailsense/types';
import { createLogger } from '@observability';
import { CaughtError } from '@types';
import { IAiProvider } from '../ai.provider.js';
import { GeminiProviderConfig, GeminiRawApiError, GeminiStructuredGenerationResult } from '../ai.provider.types.js';
import {
    geminiClassifyAndScoreAiResponseSchema,
    geminiGenerateSuggestedRepliesAiResponseSchema,
    geminiSummarizeEmailThreadAiResponseSchema,
} from '../utils/gemini.utils.js';

const logger = createLogger(LOGGER_MODULE.GEMINI_PROVIDER);

const DEFAULT_TIMEOUT_MS = 30000;
const MAX_BODY_CHARACTERS = 4000;

export class GeminiAiProvider implements IAiProvider {
    public readonly name: AI_PROVIDER_NAME = AI_PROVIDER_NAME.GEMINI;
    private readonly client: GoogleGenAI;
    private readonly modelName: string;
    private readonly timeoutMs: number;

    constructor(config?: GeminiProviderConfig) {
        const apiKey = config?.apiKey ?? AI_CONFIG.geminiApiKey;
        if (!apiKey) {
            throw new ConfigurationError(
                'GEMINI_API_KEY environment variable is required to initialize GeminiAiProvider.',
                'GEMINI_API_KEY',
                'Add GEMINI_API_KEY to your environment variables or switch AI_PROVIDER to noop.',
            );
        }
        this.client = new GoogleGenAI({ apiKey });
        this.modelName = config?.modelName ?? AI_CONFIG.geminiModel;
        this.timeoutMs = config?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    }

    public async classifyAndScoreEmail(params: AiClassifyEmailParams): Promise<AiClassifyEmailResult> {
        const startTime = Date.now();
        const sanitizedBody = this.sanitizeText(params.bodyPlain);
        const prompt = [
            `Classify the following incoming email message into a category, priority level, tags, and brief 1-sentence summary.`,
            `Subject: ${params.subject}`,
            `From: ${params.from}`,
            `To: ${params.to.join(', ')}`,
            `Received: ${params.receivedAt.toISOString()}`,
            `Body:`,
            sanitizedBody,
        ].join('\n');

        const schema = geminiClassifyAndScoreAiResponseSchema();

        try {
            const generated = await this.generateWithSchema<AiClassifyEmailResult>(prompt, schema);
            logger.info('Email classified successfully by Gemini', {
                category: generated.data.category,
                priority: generated.data.priority,
                durationMs: Date.now() - startTime,
            });
            return {
                ...generated.data,
                tokenUsage: generated.tokenUsage,
                modelName: generated.modelName,
            };
        } catch (error) {
            const caughtError: CaughtError = error instanceof Error || (typeof error === 'object' && error !== null) ? error : String(error);
            throw this.buildProviderError(caughtError, 'classifyAndScoreEmail', Date.now() - startTime);
        }
    }

    public async summarizeEmailThread(params: AiSummarizeThreadParams): Promise<AiSummarizeThreadResult> {
        const startTime = Date.now();
        const messagesText = params.messages
            .map((msg, index) => {
                const body = this.sanitizeText(msg.bodyPlain);
                return `--- Message ${index + 1} from ${msg.from} on ${msg.date.toISOString()} ---\n${body}`;
            })
            .join('\n\n');

        const prompt = [
            `Summarize the following email conversation thread into an executive summary, bulleted key points, and clear action items.`,
            `Thread Subject: ${params.threadSubject}`,
            messagesText,
        ].join('\n');

        try {
            const generated = await this.generateWithSchema<AiSummarizeThreadResult>(prompt, geminiSummarizeEmailThreadAiResponseSchema());
            logger.info('Thread summarized successfully by Gemini', {
                keyPointsCount: generated.data.keyPoints.length,
                actionItemsCount: generated.data.actionItems.length,
                durationMs: Date.now() - startTime,
            });
            return {
                ...generated.data,
                tokenUsage: generated.tokenUsage,
                modelName: generated.modelName,
            };
        } catch (error) {
            const caughtError: CaughtError = error instanceof Error || (typeof error === 'object' && error !== null) ? error : String(error);
            throw this.buildProviderError(caughtError, 'summarizeEmailThread', Date.now() - startTime);
        }
    }

    public async generateSuggestedReplies(params: AiSuggestedRepliesParams): Promise<AiSuggestedRepliesResult> {
        const startTime = Date.now();
        const sanitizedBody = this.sanitizeText(params.bodyPlain);
        const threadContext = params.recentMessages
            ? params.recentMessages.map((msg, idx) => `[Prior Msg ${idx + 1} (${msg.from})]: ${this.sanitizeText(msg.bodyPlain)}`).join('\n')
            : '';

        const prompt = [
            `Generate 2 to 3 contextual, natural suggested replies to the latest email in this conversation.`,
            threadContext ? `Conversation Context:\n${threadContext}\n` : '',
            `Latest Message Subject: ${params.subject}`,
            `From: ${params.from}`,
            `To: ${params.to.join(', ')}`,
            `Content:`,
            sanitizedBody,
        ].join('\n');

        try {
            const generated = await this.generateWithSchema<AiSuggestedRepliesResult>(prompt, geminiGenerateSuggestedRepliesAiResponseSchema());
            logger.info('Suggested replies generated successfully by Gemini', {
                suggestionCount: generated.data.suggestions.length,
                durationMs: Date.now() - startTime,
            });
            return {
                ...generated.data,
                tokenUsage: generated.tokenUsage,
                modelName: generated.modelName,
            };
        } catch (error) {
            const caughtError: CaughtError = error instanceof Error || (typeof error === 'object' && error !== null) ? error : String(error);
            throw this.buildProviderError(caughtError, 'generateSuggestedReplies', Date.now() - startTime);
        }
    }

    private async generateWithSchema<T>(prompt: string, schema: object): Promise<GeminiStructuredGenerationResult<T>> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const response = await this.client.models.generateContent({
                model: this.modelName,
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: schema,
                    temperature: 0.1,
                    abortSignal: controller.signal,
                },
            });

            const text = response.text;
            if (!text) {
                throw new AiProcessingError({
                    provider: 'gemini',
                    model: this.modelName,
                    message: 'Gemini API returned an empty text payload.',
                });
            }
            return {
                data: JSON.parse(text) as T,
                tokenUsage: this.extractTokenUsage(response.usageMetadata),
                modelName: this.modelName,
            };
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private extractTokenUsage(metadata?: GenerateContentResponseUsageMetadata): AiTokenUsage | undefined {
        if (!metadata) {
            return undefined;
        }
        const inputTokens = metadata.promptTokenCount ?? 0;
        const outputTokens = metadata.candidatesTokenCount ?? 0;
        const totalTokens = metadata.totalTokenCount ?? inputTokens + outputTokens;

        return {
            inputTokens,
            outputTokens,
            totalTokens,
            ...(metadata.cachedContentTokenCount !== undefined ? { cachedTokens: metadata.cachedContentTokenCount } : {}),
        };
    }

    private sanitizeText(raw: string): string {
        if (!raw) return '';
        const stripped = raw
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        return stripped.slice(0, MAX_BODY_CHARACTERS);
    }

    private buildProviderError(error: CaughtError, operation: string, durationMs: number): AppError {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Gemini AI operation failed: ${operation}`, {
            error: message,
            durationMs,
        });

        if (this.isRateLimitError(error)) {
            const retryAfterMs = this.extractRetryAfterMs(error) ?? 10000;
            return new RateLimitError('gemini', retryAfterMs);
        }

        return new AiProcessingError({
            provider: 'gemini',
            model: this.modelName,
            message: `Failed during ${operation}: ${message}`,
            processingDurationMs: durationMs,
        });
    }

    private isRateLimitError(error: CaughtError): boolean {
        if (typeof error !== 'object' || error === null) {
            return false;
        }
        const err = error as GeminiRawApiError;
        if (err.status === 429 || err.statusCode === 429) {
            return true;
        }
        const message = String(err.message ?? '');
        return message.includes('RESOURCE_EXHAUSTED') || message.includes('429');
    }

    private extractRetryAfterMs(error: CaughtError): number | undefined {
        if (typeof error !== 'object' || error === null) {
            return undefined;
        }
        const err = error as GeminiRawApiError;
        const retryHeader = err.headers?.['retry-after'];
        if (!retryHeader) {
            return undefined;
        }
        const parsed = parseInt(retryHeader, 10);
        return isNaN(parsed) ? undefined : parsed * 1000;
    }
}
