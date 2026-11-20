import { AI_PROVIDER_NAME } from '@mailsense/types';
import { BadRequestError } from '../../../core/errors/DomainErrors.js';
import { AiProviderFactory } from '../ai.provider.factory.js';
import { GeminiAiProvider } from '../providers/gemini.provider.js';
import { NoopAiProvider } from '../providers/noop.provider.js';

describe('AiProviderFactory', () => {
    beforeEach(() => {
        AiProviderFactory.reset();
    });

    it('resolves NoopAiProvider when requested explicitly', () => {
        const provider = AiProviderFactory.getProvider(AI_PROVIDER_NAME.NOOP);
        expect(provider).toBeInstanceOf(NoopAiProvider);
        expect(provider.name).toBe(AI_PROVIDER_NAME.NOOP);
    });

    it('defaults to NoopAiProvider in test environment when no provider is specified', () => {
        const provider = AiProviderFactory.getProvider();
        expect(provider).toBeInstanceOf(NoopAiProvider);
    });

    it('returns the cached singleton instance on subsequent calls', () => {
        const instance1 = AiProviderFactory.getProvider(AI_PROVIDER_NAME.NOOP);
        const instance2 = AiProviderFactory.getProvider(AI_PROVIDER_NAME.NOOP);
        expect(instance1).toBe(instance2);
    });

    it('resolves GeminiAiProvider when explicitly requested with valid API key', () => {
        process.env.GEMINI_API_KEY = 'test-gemini-key';
        const provider = AiProviderFactory.getProvider(AI_PROVIDER_NAME.GEMINI);
        expect(provider).toBeInstanceOf(GeminiAiProvider);
        expect(provider.name).toBe(AI_PROVIDER_NAME.GEMINI);
    });

    it('throws BadRequestError for unsupported future providers', () => {
        expect(() => {
            AiProviderFactory.getProvider(AI_PROVIDER_NAME.OPENAI);
        }).toThrow(BadRequestError);

        expect(() => {
            AiProviderFactory.getProvider(AI_PROVIDER_NAME.ANTHROPIC);
        }).toThrow(BadRequestError);
    });

    it('clears cached providers on reset()', () => {
        const first = AiProviderFactory.getProvider(AI_PROVIDER_NAME.NOOP);
        AiProviderFactory.reset();
        const second = AiProviderFactory.getProvider(AI_PROVIDER_NAME.NOOP);
        expect(first).not.toBe(second);
    });
});
