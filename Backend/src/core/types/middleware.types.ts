import { z } from 'zod';

export interface SchemaMap {
    headers?: z.ZodSchema;
    params?: z.ZodSchema;
    query?: z.ZodSchema;
    body?: z.ZodSchema;
}
