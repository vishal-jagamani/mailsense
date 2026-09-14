export interface ApiValidationDetail {
    field: string;
    message: string;
    value?: string | number | boolean;
}

export interface ApiErrorDetail {
    code: number;
    errorCode: string;
    traceId: string;
    description: string;
    suggestedAction: string;
    details?: ApiValidationDetail[];
}

export interface ApiErrorResponse {
    status: false;
    message: string;
    error: ApiErrorDetail;
}

export interface FormattedClientError {
    message: string;
    errorCode: string;
    traceId: string;
    description: string;
    suggestedAction: string;
    httpStatus: number;
}
