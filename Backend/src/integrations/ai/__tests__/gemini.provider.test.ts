import { EMAIL_AI_CATEGORY, EMAIL_AI_PRIORITY, SUGGESTED_REPLY_TONE } from '@mailsense/types';
import { AiProcessingError, ConfigurationError, RateLimitError } from '../../../core/errors/DomainErrors.js';
import { GeminiAiProvider } from '../providers/gemini.provider.js';

// Mock the GoogleGenAI SDK module
jest.mock('@google/genai', () => {
    return {
        GoogleGenAI: jest.fn().mockImplementation(() => ({
            models: {
                generateContent: jest.fn(),
            },
        })),
    };
});

describe('GeminiAiProvider', () => {
    const mockApiKey = 'test-gemini-api-key';

    it('throws ConfigurationError when API key is missing', () => {
        expect(() => {
            new GeminiAiProvider({ apiKey: '' });
        }).toThrow(ConfigurationError);
    });

    it('classifies email and returns structured classification result', async () => {
        const provider = new GeminiAiProvider({ apiKey: mockApiKey });
        const mockClient = (
            provider as unknown as {
                client: { models: { generateContent: jest.Mock } };
            }
        ).client;

        mockClient.models.generateContent.mockResolvedValueOnce({
            text: JSON.stringify({
                category: EMAIL_AI_CATEGORY.WORK,
                priority: EMAIL_AI_PRIORITY.HIGH,
                summary: 'Quarterly review report submission deadline.',
                tags: ['quarterly', 'review'],
                confidence: 0.95,
            }),
        });

        const result = await provider.classifyAndScoreEmail({
            subject: 'Q3 Financial Review Deadline',
            from: 'manager@company.com',
            to: ['user@company.com'],
            bodyPlain: 'Please submit your Q3 review report by Friday EOD.',
            receivedAt: new Date('2026-11-20T10:00:00Z'),
        });

        expect(result.category).toBe(EMAIL_AI_CATEGORY.WORK);
        expect(result.priority).toBe(EMAIL_AI_PRIORITY.HIGH);
        expect(result.summary).toContain('Quarterly review');
        expect(result.confidence).toBe(0.95);
        expect(mockClient.models.generateContent).toHaveBeenCalledWith(
            expect.objectContaining({
                model: 'gemini-3.6-flash',
                config: expect.objectContaining({
                    responseMimeType: 'application/json',
                    temperature: 0.1,
                }),
            }),
        );
    });

    it('summarizes email thread and returns key points and action items', async () => {
        const provider = new GeminiAiProvider({ apiKey: mockApiKey });
        const mockClient = (
            provider as unknown as {
                client: { models: { generateContent: jest.Mock } };
            }
        ).client;

        mockClient.models.generateContent.mockResolvedValueOnce({
            text: JSON.stringify({
                summary: 'Discussion regarding API schema migration.',
                keyPoints: ['Schema migration scheduled for Sunday.', 'Downtime expected to be 15 minutes.'],
                actionItems: ['Review migration script by Friday.'],
            }),
        });

        const result = await provider.summarizeEmailThread({
            threadSubject: 'Database Migration Window',
            messages: [
                {
                    from: 'devops@company.com',
                    date: new Date('2026-11-20T09:00:00Z'),
                    bodyPlain: 'We need to perform schema migration this weekend.',
                },
            ],
        });

        expect(result.summary).toContain('API schema migration');
        expect(result.keyPoints).toHaveLength(2);
        expect(result.actionItems).toHaveLength(1);
    });

    it('generates contextual suggested replies', async () => {
        const provider = new GeminiAiProvider({ apiKey: mockApiKey });
        const mockClient = (
            provider as unknown as {
                client: { models: { generateContent: jest.Mock } };
            }
        ).client;

        mockClient.models.generateContent.mockResolvedValueOnce({
            text: JSON.stringify({
                suggestions: [
                    {
                        id: 'sug-1',
                        title: 'Acknowledge',
                        body: 'Will review and get back to you.',
                        tone: SUGGESTED_REPLY_TONE.FORMAL,
                    },
                ],
            }),
        });

        const result = await provider.generateSuggestedReplies({
            subject: 'Meeting notes',
            from: 'colleague@company.com',
            to: ['user@company.com'],
            bodyPlain: 'Here are the notes from today.',
            receivedAt: new Date(),
        });

        expect(result.suggestions).toHaveLength(1);
        expect(result.suggestions[0].tone).toBe(SUGGESTED_REPLY_TONE.FORMAL);
    });

    it('translates HTTP 429 quota exhaustion to RateLimitError', async () => {
        const provider = new GeminiAiProvider({ apiKey: mockApiKey });
        const mockClient = (
            provider as unknown as {
                client: { models: { generateContent: jest.Mock } };
            }
        ).client;

        mockClient.models.generateContent.mockRejectedValueOnce({
            status: 429,
            message: 'Resource exhausted: rate limit exceeded.',
            headers: { 'retry-after': '15' },
        });

        await expect(
            provider.classifyAndScoreEmail({
                subject: 'Test',
                from: 'test@example.com',
                to: ['test@example.com'],
                bodyPlain: 'Test body',
                receivedAt: new Date(),
            }),
        ).rejects.toThrow(RateLimitError);
    });

    it('translates general upstream failures to AiProcessingError', async () => {
        const provider = new GeminiAiProvider({ apiKey: mockApiKey });
        const mockClient = (
            provider as unknown as {
                client: { models: { generateContent: jest.Mock } };
            }
        ).client;

        mockClient.models.generateContent.mockRejectedValueOnce(new Error('Network connection reset'));

        await expect(
            provider.classifyAndScoreEmail({
                subject: 'Test',
                from: 'test@example.com',
                to: ['test@example.com'],
                bodyPlain: 'Test body',
                receivedAt: new Date(),
            }),
        ).rejects.toThrow(AiProcessingError);
    });
});
