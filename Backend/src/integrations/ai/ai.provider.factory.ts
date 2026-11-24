import { AI_CONFIG } from '@config';
import { LOGGER_MODULE } from '@constants';
import { BadRequestError } from '@errors';
import { AI_PROVIDER_NAME } from '@mailsense/types';
import { createLogger } from '@observability';
import { IAiProvider } from './ai.provider.js';
import { GeminiAiProvider } from './providers/gemini.provider.js';
import { NoopAiProvider } from './providers/noop.provider.js';

const logger = createLogger(LOGGER_MODULE.AI_PROVIDER_FACTORY);

export class AiProviderFactory {
    private static readonly providers: Map<AI_PROVIDER_NAME, IAiProvider> = new Map();

    /**
     * Resolves the configured or explicitly requested AI provider singleton.
     * When running under NODE_ENV === 'test' and no provider is specified, defaults to NoopAiProvider.
     */
    public static getProvider(providerName?: AI_PROVIDER_NAME): IAiProvider {
        const resolvedName = providerName ?? this.getDefaultProviderName();

        let provider = this.providers.get(resolvedName);
        if (!provider) {
            provider = this.createProvider(resolvedName);
            this.providers.set(resolvedName, provider);
            logger.info(`Initialized and cached AI provider strategy: ${resolvedName}`);
        }
        return provider;
    }

    private static getDefaultProviderName(): AI_PROVIDER_NAME {
        if (process.env.NODE_ENV === 'test') {
            return AI_PROVIDER_NAME.NOOP;
        }
        return (AI_CONFIG.provider as AI_PROVIDER_NAME) ?? AI_PROVIDER_NAME.GEMINI;
    }

    private static createProvider(providerName: AI_PROVIDER_NAME): IAiProvider {
        switch (providerName) {
            case AI_PROVIDER_NAME.GEMINI:
                return new GeminiAiProvider();
            case AI_PROVIDER_NAME.NOOP:
                return new NoopAiProvider();
            case AI_PROVIDER_NAME.OPENAI:
            case AI_PROVIDER_NAME.ANTHROPIC:
                throw new BadRequestError(
                    `AI provider '${providerName}' is not yet supported in this release. Supported: gemini, noop.`,
                    'Select a supported AI provider strategy.',
                    'Configure AI_PROVIDER=gemini or AI_PROVIDER=noop in your environment.',
                );
            default:
                throw new BadRequestError(
                    `Unsupported AI provider strategy: '${String(providerName)}'.`,
                    'Invalid AI provider strategy identifier.',
                    'Configure AI_PROVIDER=gemini or AI_PROVIDER=noop.',
                );
        }
    }

    // Resets the singleton cache. Used exclusively between test cases.
    public static reset(): void {
        this.providers.clear();
        logger.debug('AiProviderFactory singleton cache cleared.');
    }
}
