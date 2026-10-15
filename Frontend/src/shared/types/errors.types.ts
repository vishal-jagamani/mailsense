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

export interface ErrorBoundaryFallbackProps {
    readonly error: Error;
    readonly traceId: string;
    readonly resetErrorBoundary: () => void;
}

export interface ErrorBoundaryProps {
    readonly children: import('react').ReactNode;
    readonly fallbackRender?: (props: ErrorBoundaryFallbackProps) => import('react').ReactNode;
    readonly onError?: (error: Error, traceId: string) => void;
}

export interface ErrorBoundaryContextValue {
    readonly showBoundary: (error: Error) => void;
    readonly resetBoundary: () => void;
}

export interface ErrorBoundaryInternalState {
    readonly error: Error;
    readonly traceId: string;
}

export interface ErrorFallbackProps {
    readonly error: Error;
    readonly traceId: string;
    readonly resetErrorBoundary: () => void;
}

