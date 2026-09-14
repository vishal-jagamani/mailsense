import { ValidationDetail } from '@types';
import { BadRequestError, NotFoundError, ValidationError } from './DomainErrors.js';

export function createNotFoundError(resource: string, identifier: string, traceId?: string): NotFoundError {
    return new NotFoundError(resource, identifier, traceId);
}

export function createBadRequestError(message: string, description?: string, suggestedAction?: string, traceId?: string): BadRequestError {
    return new BadRequestError(message, description, suggestedAction, traceId);
}

export function createValidationError(message: string, details: ValidationDetail[], traceId?: string): ValidationError {
    return new ValidationError(message, details, traceId);
}
