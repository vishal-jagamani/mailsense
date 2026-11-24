import {
    AI_PROVIDER_NAME,
    AiClassifyEmailParams,
    AiClassifyEmailResult,
    AiSuggestedRepliesParams,
    AiSuggestedRepliesResult,
    AiSummarizeThreadParams,
    AiSummarizeThreadResult,
} from '@mailsense/types';

/**
 * Strategy interface defining required AI capabilities.
 * All concrete providers (Gemini, OpenAI, Noop) must conform to this contract.
 */
export interface IAiProvider {
    readonly name: AI_PROVIDER_NAME;

    // Classifies email category, priority level, tags, and 1-line summary.
    classifyAndScoreEmail(params: AiClassifyEmailParams): Promise<AiClassifyEmailResult>;

    // Summarizes a multi-message email thread into executive key points and action items.
    summarizeEmailThread(params: AiSummarizeThreadParams): Promise<AiSummarizeThreadResult>;

    // Generates 2-3 contextual quick reply suggestions adapted to thread tone.
    generateSuggestedReplies(params: AiSuggestedRepliesParams): Promise<AiSuggestedRepliesResult>;
}
