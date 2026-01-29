import { z } from 'zod';

export const catFactQuerySchema = z.object({
    id: z
        .string()
        .transform((val) => (val ? parseInt(val, 10) : undefined))
        .refine((val) => val === undefined || !isNaN(val), {
            message: 'id must be a number',
        }),
});

export type CatFactQuerySchema = z.infer<typeof catFactQuerySchema>;
