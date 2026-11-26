import { AI_JOB_STATUS, AI_OPERATION_TYPE, AI_PROCESSING_STATUS, AI_PROVIDER_NAME } from '@mailsense/types';
import { GeminiAiProvider } from '../../../integrations/ai/providers/gemini.provider.js';
import { AiJob } from '../database/ai-job.model.js';
import { AiJobRepository } from '../database/index.js';

const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
    GoogleGenAI: jest.fn().mockImplementation(() => ({
        models: {
            generateContent: mockGenerateContent,
        },
    })),
    Type: {
        OBJECT: 'OBJECT',
        STRING: 'STRING',
        ARRAY: 'ARRAY',
        NUMBER: 'NUMBER',
    },
}));

describe('Phase 3 - AI Job Lifecycle & Token Telemetry', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('extracts Gemini response.usageMetadata into AiTokenUsage for classification', async () => {
        mockGenerateContent.mockResolvedValue({
            text: JSON.stringify({
                category: 'WORK',
                priority: 'HIGH',
                summary: 'Client budget approval request',
                tags: ['budget', 'client'],
                confidence: 0.96,
            }),
            usageMetadata: {
                promptTokenCount: 412,
                candidatesTokenCount: 88,
                totalTokenCount: 500,
                cachedContentTokenCount: 64,
            },
        });

        const provider = new GeminiAiProvider({ apiKey: 'test-key', modelName: 'gemini-3.6-flash' });
        const result = await provider.classifyAndScoreEmail({
            subject: 'Q4 Budget Approval',
            from: 'cfo@company.com',
            to: ['lead@company.com'],
            bodyPlain: 'Please review and sign off on Q4 budget numbers.',
            receivedAt: new Date('2026-11-26T10:00:00Z'),
        });

        expect(result.modelName).toBe('gemini-3.6-flash');
        expect(result.tokenUsage).toEqual({
            inputTokens: 412,
            outputTokens: 88,
            totalTokens: 500,
            cachedTokens: 64,
        });
    });

    it('delegates background upserts and on-demand creates directly to AiJob Mongoose model', async () => {
        const upsertSpy = jest.spyOn(AiJob, 'findOneAndUpdate').mockResolvedValueOnce(null as unknown as never);
        const createSpy = jest.spyOn(AiJob, 'create').mockResolvedValueOnce([] as unknown as never);

        await AiJobRepository.upsertBackgroundJob('bull-ai-99', {
            userId: 'user-1',
            accountId: 'acc-1',
            emailId: 'email-1',
            operationType: AI_OPERATION_TYPE.BACKGROUND_CLASSIFICATION,
            status: AI_JOB_STATUS.RUNNING,
            provider: AI_PROVIDER_NAME.GEMINI,
            modelName: 'gemini-3.6-flash',
            startedAt: 1700000000,
        });

        await AiJobRepository.createOnDemandJob({
            userId: 'user-1',
            accountId: 'acc-1',
            emailId: 'email-1',
            operationType: AI_OPERATION_TYPE.ON_DEMAND_SUMMARY,
            status: AI_JOB_STATUS.COMPLETED,
            provider: AI_PROVIDER_NAME.GEMINI,
            modelName: 'gemini-3.6-flash',
            startedAt: 1700000000,
            completedAt: 1700000500,
            processingDurationMs: 500,
            tokenUsage: { inputTokens: 300, outputTokens: 120, totalTokens: 420 },
        });

        expect(upsertSpy).toHaveBeenCalledWith(
            { bullJobId: 'bull-ai-99' },
            { $set: expect.objectContaining({ status: AI_JOB_STATUS.RUNNING }) },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );
        expect(createSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                operationType: AI_OPERATION_TYPE.ON_DEMAND_SUMMARY,
                tokenUsage: { inputTokens: 300, outputTokens: 120, totalTokens: 420 },
            }),
        );
        expect(AI_PROCESSING_STATUS.RATE_LIMITED).toBeDefined();
    });
});
