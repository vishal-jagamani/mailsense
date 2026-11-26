import { LOGGER_MODULE } from '@constants';
import {
    AI_PROVIDER_NAME,
    AiClassifyEmailParams,
    AiClassifyEmailResult,
    AiSuggestedRepliesParams,
    AiSuggestedRepliesResult,
    AiSummarizeThreadParams,
    AiSummarizeThreadResult,
    EMAIL_AI_CATEGORY,
    EMAIL_AI_PRIORITY,
    SUGGESTED_REPLY_TONE,
} from '@mailsense/types';
import { createLogger } from '@observability';
import { IAiProvider } from '../ai.provider.js';

const logger = createLogger(LOGGER_MODULE.NOOP_AI_PROVIDER);

/**
 * Deterministic mock AI provider used for unit testing, CI/CD pipelines,
 * and offline development environments. Zero API cost and zero network calls.
 */
export class NoopAiProvider implements IAiProvider {
    public readonly name: AI_PROVIDER_NAME = AI_PROVIDER_NAME.NOOP;

    public async classifyAndScoreEmail(params: AiClassifyEmailParams): Promise<AiClassifyEmailResult> {
        logger.debug('NoopAiProvider.classifyAndScoreEmail called', {
            subject: params.subject,
            from: params.from,
        });
        return {
            category: EMAIL_AI_CATEGORY.GENERAL,
            priority: EMAIL_AI_PRIORITY.NORMAL,
            summary: `Summary of: ${params.subject.slice(0, 50)}`,
            tags: ['general', 'inbox'],
            confidence: 1.0,
            tokenUsage: { inputTokens: 120, outputTokens: 45, totalTokens: 165 },
            modelName: 'noop-mock',
        };
    }

    public async summarizeEmailThread(params: AiSummarizeThreadParams): Promise<AiSummarizeThreadResult> {
        logger.debug('NoopAiProvider.summarizeEmailThread called', {
            subject: params.threadSubject,
            messageCount: params.messages.length,
        });
        return {
            summary: `Automated summary for thread: ${params.threadSubject}`,
            keyPoints: ['Noop key point: Thread conversation reviewed.', 'No critical blockers identified.'],
            actionItems: ['No immediate action required.'],
            tokenUsage: { inputTokens: 200, outputTokens: 80, totalTokens: 280 },
            modelName: 'noop-mock',
        };
    }

    public async generateSuggestedReplies(params: AiSuggestedRepliesParams): Promise<AiSuggestedRepliesResult> {
        logger.debug('NoopAiProvider.generateSuggestedReplies called', {
            subject: params.subject,
        });
        return {
            suggestions: [
                {
                    id: 'noop-suggestion-1',
                    title: 'Acknowledge Receipt',
                    body: 'Thank you for your email. I have received your message and will review it shortly.',
                    tone: SUGGESTED_REPLY_TONE.FORMAL,
                },
                {
                    id: 'noop-suggestion-2',
                    title: 'Quick Thanks',
                    body: 'Thanks for the update! Looks good to me.',
                    tone: SUGGESTED_REPLY_TONE.CASUAL,
                },
                {
                    id: 'noop-suggestion-3',
                    title: 'Confirm',
                    body: 'Confirmed, thank you.',
                    tone: SUGGESTED_REPLY_TONE.CONCISE,
                },
            ],
            tokenUsage: { inputTokens: 160, outputTokens: 90, totalTokens: 250 },
            modelName: 'noop-mock',
        };
    }
}
