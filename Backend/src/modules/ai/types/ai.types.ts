import { AI_PROVIDER_NAME, GetEmailSummaryResponse, GetSuggestedRepliesResponse } from '@mailsense/types';

export interface EmailSummaryResultDTO extends GetEmailSummaryResponse {
    provider: AI_PROVIDER_NAME;
}

export interface SuggestedRepliesResultDTO extends GetSuggestedRepliesResponse {
    provider?: AI_PROVIDER_NAME;
}

export interface ThreadSummarizationContext {
    emailId: string;
    accountId: string;
    threadId: string;
    subject: string;
}
