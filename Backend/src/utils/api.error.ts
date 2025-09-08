export class ApiError extends Error {
    public readonly status: number;
    public readonly description?: string;
    public readonly suggestedAction?: string;
    public readonly isOperational: boolean;

    constructor(status: number, message: string, description?: string, suggestedAction?: string, isOperational = true) {
        super(message);

        // Restore prototype chain (important when extending Error in TS)
        Object.setPrototypeOf(this, new.target.prototype);

        this.status = status;
        this.description = description;
        this.suggestedAction = suggestedAction;
        this.isOperational = isOperational;

        // Capture stack trace for debugging
        Error.captureStackTrace(this, this.constructor);
    }
}

export const createApiError = (status: number, message: string, description?: string, suggestedAction?: string): ApiError => {
    return new ApiError(status, message, description, suggestedAction);
};
