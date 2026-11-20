import { AiProcessingError } from '../DomainErrors.js';
import { ErrorCode } from '../ErrorCodes.js';

describe('AiProcessingError', () => {
    it('initializes with correct HTTP status 502, error code, and context', () => {
        const error = new AiProcessingError({
            provider: 'gemini',
            model: 'gemini-3.6-flash',
            message: 'API quota exceeded',
            processingDurationMs: 1420,
            traceId: 'test-trace-123',
        });

        expect(error.httpStatus).toBe(502);
        expect(error.errorCode).toBe(ErrorCode.AI_PROCESSING_FAILED);
        expect(error.provider).toBe('gemini');
        expect(error.model).toBe('gemini-3.6-flash');
        expect(error.processingDurationMs).toBe(1420);
        expect(error.traceId).toBe('test-trace-123');
        expect(error.message).toBe('[AI:GEMINI] API quota exceeded');
        expect(error.isOperational).toBe(true);
    });

    it('falls back to default description and action when omitted', () => {
        const error = new AiProcessingError({
            provider: 'noop',
            message: 'Operation failed',
        });

        expect(error.description).toContain("provider 'noop'");
        expect(error.suggestedAction).toBeDefined();
    });
});
