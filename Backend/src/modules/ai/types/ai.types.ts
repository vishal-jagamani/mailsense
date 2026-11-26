import {
    AI_JOB_STATUS,
    AI_OPERATION_TYPE,
    AI_PROVIDER_NAME,
    AiProcessingJobAttributes,
    AiSuggestedRepliesParams,
    AiTokenUsage,
    CreateEntityInput,
    GetEmailSummaryResponse,
    GetSuggestedRepliesResponse,
} from '@mailsense/types';

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

export type AiJobInput = CreateEntityInput<AiProcessingJobAttributes>;

export interface OnDemandAiTelemetryContext {
    userId: string;
    accountId: string;
    emailId: string;
    operationType: AI_OPERATION_TYPE;
    provider: AI_PROVIDER_NAME;
    startedAt: number;
}

export interface OnDemandAiTelemetryParams extends OnDemandAiTelemetryContext {
    status: AI_JOB_STATUS;
    modelName: string;
    completedAt: number;
    tokenUsage?: AiTokenUsage;
    errorMessage?: string;
    errorCode?: string;
    traceId?: string;
}

export interface SuggestedRepliesTelemetryBundle {
    telemetryContext: OnDemandAiTelemetryContext;
    params: AiSuggestedRepliesParams;
}
