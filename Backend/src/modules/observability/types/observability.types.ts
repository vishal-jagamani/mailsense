import { CreateEntityInput, ERROR_LOG_SEVERITY, ERROR_LOG_SOURCE, ErrorLogAttributes, ErrorLogContext } from '@mailsense/types';

export type ErrorLogInput = Omit<CreateEntityInput<ErrorLogAttributes>, 'resolved' | 'occurrenceCount'>;

export interface RecordSystemErrorInput {
    source: ERROR_LOG_SOURCE;
    severity: ERROR_LOG_SEVERITY;
    module: string;
    errorCode: string;
    httpStatus?: number;
    message: string;
    stack?: string;
    traceId?: string;
    context?: ErrorLogContext;
}

export interface RecordClientErrorResult {
    logged: boolean;
    traceId: string;
}
