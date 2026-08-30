import { ANALYTICS_TIMEFRAME } from '@mailsense/types';
import z from 'zod';

export const analyticsQuerySchema = z.object({
    accountId: z.string().optional(),
    timeframe: z.enum(ANALYTICS_TIMEFRAME).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export type AnalyticsQuerySchema = z.infer<typeof analyticsQuerySchema>;
