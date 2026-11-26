import { z } from 'zod';

export const reportClientErrorSchema = z.object({
    message: z.string().trim().min(1, 'Error message is required').max(1000),
    stack: z.string().max(2000).optional(),
    componentStack: z.string().max(2000).optional(),
    traceId: z.string().max(128).optional(),
    pageUrl: z.string().trim().min(1).max(500),
    appVersion: z.string().trim().min(1).max(32),
});
