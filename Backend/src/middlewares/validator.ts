import { NextFunction, Request, Response } from 'express';
import { ZodError, z } from 'zod';

/**
 * Middleware to validate incoming requests using Zod schemas.
 *
 * @param schema - Zod schema to validate against
 * @param source - Request source: body, query, params or headers
 */
export const validate = (schema: z.ZodSchema, source: 'body' | 'query' | 'params' | 'headers') => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
        const error: ZodError = result.error;
        return res.status(400).json({
            error: {
                code: 400,
                message: 'Validation Error',
                details: z.flattenError(error),
            },
        });
    }

    next();
};
