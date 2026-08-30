import { ANALYTICS_TIMEFRAME } from '@mailsense/types';
import { calculateDateRange } from '../analytics.utils.js';

describe('Analytics Utils - calculateDateRange', () => {
    it('should calculate correct boundary for 7D timeframe', () => {
        try {
            const result = calculateDateRange(ANALYTICS_TIMEFRAME.SEVEN_DAYS);
            expect(result.startDate).toBeDefined();
            expect(result.endDate).toBeDefined();
            expect(result.prevStartDate).toBeDefined();
            expect(result.prevEndDate).toBeDefined();

            const diffDays = Math.round((result.endDate.getTime() - result.startDate.getTime()) / (1000 * 60 * 60 * 24));
            expect(diffDays).toBe(7);
        } catch (error) {
            expect(error).toBeUndefined();
        }
    });

    it('should calculate correct boundary for TODAY timeframe', () => {
        try {
            const result = calculateDateRange(ANALYTICS_TIMEFRAME.TODAY);
            expect(result.startDate.getDate()).toBe(new Date().getDate());
            expect(result.prevStartDate?.getDate()).toBe(new Date().getDate() - 1);
        } catch (error) {
            expect(error).toBeUndefined();
        }
    });

    it('should calculate correct boundary for ALL_TIME timeframe', () => {
        try {
            const result = calculateDateRange(ANALYTICS_TIMEFRAME.ALL_TIME);
            expect(result.startDate.getFullYear()).toBe(2020);
        } catch (error) {
            expect(error).toBeUndefined();
        }
    });
});

