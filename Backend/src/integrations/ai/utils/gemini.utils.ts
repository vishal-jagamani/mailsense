import { EMAIL_AI_CATEGORY, EMAIL_AI_PRIORITY, SUGGESTED_REPLY_TONE } from '@mailsense/types';

export const geminiClassifyAndScoreAiResponseSchema = () => {
    return {
        type: 'object',
        properties: {
            category: {
                type: 'string',
                enum: Object.values(EMAIL_AI_CATEGORY),
                description: 'Primary email category classification.',
            },
            priority: {
                type: 'string',
                enum: Object.values(EMAIL_AI_PRIORITY),
                description: 'Triage priority score based on urgency, relationship, and actionable deadlines.',
            },
            summary: {
                type: 'string',
                description: 'Concise, one-sentence plain-text summary (maximum 150 characters).',
            },
            tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Up to 3 relevant keyword tags.',
            },
            confidence: {
                type: 'number',
                description: 'Confidence score between 0.0 and 1.0.',
            },
        },
        required: ['category', 'priority', 'summary', 'tags', 'confidence'],
    };
};

export const geminiSummarizeEmailThreadAiResponseSchema = () => {
    return {
        type: 'object',
        properties: {
            summary: {
                type: 'string',
                description: 'High-level executive summary of the entire thread discussion.',
            },
            keyPoints: {
                type: 'array',
                items: { type: 'string' },
                description: 'Bullet list of critical facts, decisions, and takeaways.',
            },
            actionItems: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of pending deliverables, assigned action items, or direct questions requiring reply.',
            },
        },
        required: ['summary', 'keyPoints', 'actionItems'],
    };
};

export const geminiGenerateSuggestedRepliesAiResponseSchema = () => {
    return {
        type: 'object',
        properties: {
            suggestions: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Unique suggestion identifier (e.g. suggestion-1).',
                        },
                        title: {
                            type: 'string',
                            description: 'Brief 2-4 word summary chip label.',
                        },
                        body: {
                            type: 'string',
                            description: 'Full suggested email reply body text ready for composer.',
                        },
                        tone: {
                            type: 'string',
                            enum: Object.values(SUGGESTED_REPLY_TONE),
                            description: 'Tone variation of the response.',
                        },
                    },
                    required: ['id', 'title', 'body', 'tone'],
                },
            },
        },
        required: ['suggestions'],
    };
};
