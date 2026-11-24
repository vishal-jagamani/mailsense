import { LOGGER_MODULE } from '@constants';
import { ForbiddenError, NotFoundError } from '@errors';
import { AiProviderFactory } from '@integrations/ai/ai.provider.factory.js';
import {
    AiSuggestedRepliesParams,
    AiSummarizeThreadParams,
    AiThreadMessageInput,
    GetEmailSummaryResponse,
    GetSuggestedRepliesResponse,
} from '@mailsense/types';
import { EmailDocument, EmailRepository } from '@modules/emails/database/index.js';
import { createLogger } from '@observability';
import { decompressString } from '@utils';
import { AI_MODULE_CONSTANTS } from '../constants/ai.constants.js';
import { AccountRepository } from '@modules/accounts/database/account.repository.js';

const logger = createLogger(LOGGER_MODULE.AI_SERVICE);

export class AIService {
    // Generates an executive summary, key bullet points, and action items for an email thread.
    public async summarizeThread(userId: string, emailId: string): Promise<GetEmailSummaryResponse> {
        const startTime = Date.now();
        logger.info('Initiating on-demand thread summarization', {
            userId,
            emailId,
        });

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
        const params: AiSummarizeThreadParams = {
            threadSubject: email.subject,
            messages,
        };

        const result = await provider.summarizeEmailThread(params);
        const durationMs = Date.now() - startTime;

        logger.info('Thread summarization completed successfully', {
            threadId: email.threadId,
            provider: provider.name,
            durationMs,
        });

        return {
            emailId: email._id,
            summary: result.summary,
            keyPoints: result.keyPoints,
            actionItems: result.actionItems,
            generatedAt: Date.now(),
        };
    }

    // Generates 2–3 contextual suggested replies for the latest message in a conversation.
    public async getSuggestedReplies(userId: string, emailId: string): Promise<GetSuggestedRepliesResponse> {
        const startTime = Date.now();
        logger.info('Initiating suggested replies generation', { userId, emailId });

        // 1. Retrieve target email and verify ownership
        const email = await this.resolveAndAuthorizeEmail(userId, emailId);

        // 2. Gather prior messages in thread for conversation context
        const threadEmails = await EmailRepository.getEmailsByThreadId(email.threadId, email.accountId);
        const priorMessages = threadEmails
            .filter((m) => String(m._id) !== emailId)
            .slice(-AI_MODULE_CONSTANTS.MAX_RECENT_THREAD_CONTEXT_MESSAGES)
            .map((m) => ({
                from: m.from,
                date: m.receivedAt,
                bodyPlain: decompressString(m.bodyPlain),
            }));

        // 3. Delegate to configured AI Provider Strategy
        const provider = AiProviderFactory.getProvider();
        const params: AiSuggestedRepliesParams = {
            subject: email.subject,
            from: email.from,
            to: email.to,
            bodyPlain: decompressString(email.bodyPlain),
            receivedAt: email.receivedAt,
            recentMessages: priorMessages.length > 0 ? priorMessages : undefined,
        };

        const result = await provider.generateSuggestedReplies(params);
        const durationMs = Date.now() - startTime;

        logger.info('Suggested replies generated successfully', {
            emailId,
            suggestionCount: result.suggestions.length,
            provider: provider.name,
            durationMs,
        });

        return {
            emailId,
            suggestions: result.suggestions,
            generatedAt: Date.now(),
        };
    }

    // Verifies that the requested email exists and belongs to an account owned by the caller.
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
