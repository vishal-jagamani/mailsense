export class AppError extends Error {
    public status: number;
    public isOperational: boolean;
    public description?: string;
    public suggestedAction?: string;
    public error?: unknown;

    constructor({
        message,
        status = 500,
        isOperational = true,
        description,
        suggestedAction,
        error,
    }: {
        message: string;
        status?: number;
        isOperational?: boolean;
        description?: string;
        suggestedAction?: string;
        error?: unknown;
    }) {
        super(message);

        this.status = status;
        this.isOperational = isOperational;
        this.description = description;
        this.suggestedAction = suggestedAction;
        this.error = error;

        Error.captureStackTrace(this, this.constructor);
    }
}
