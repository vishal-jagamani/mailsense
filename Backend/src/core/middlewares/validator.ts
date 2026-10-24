import { NextFunction, Request, Response } from 'express';
import { ZodError, z } from 'zod';

type SchemaMap = {
    headers?: z.ZodSchema;
    params?: z.ZodSchema;
    query?: z.ZodSchema;
    body?: z.ZodSchema;
};

/**
 * Middleware to validate incoming requests using Zod schemas.
 *
 * @param schemas - Zod schemas to validate against
 */
export const validate = (schemas: SchemaMap) => (req: Request, res: Response, next: NextFunction) => {
    try {
        const sources: (keyof SchemaMap)[] = ['headers', 'params', 'query', 'body'];
        for (const source of sources) {
            const schema = schemas[source];
            if (!schema) continue;
            const result = schema.safeParse(req[source]);
            if (!result.success) {
                const error: ZodError = result.error;
                return res.status(400).json({
                    error: {
                        code: 400,
                        message: 'Validation Error',
                        source,
                        details: error.flatten(),
                    },
                });
            }
            Object.assign(req[source], result.data);
        }
        next();
    } catch (err) {
        next(err);
    }
};
