import { DATE_RANGE } from '@types';

export const getDateRange = (dateRange: DATE_RANGE): { startDate: Date; endDate: Date } => {
    const now = new Date();
    const endDate = new Date(now);

    switch (dateRange) {
        case DATE_RANGE.TODAY: {
            const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
            const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
            return { startDate, endDate: endOfDay };
        }
        case DATE_RANGE.LAST_WEEK: {
            const startDate = new Date(now);
            startDate.setUTCDate(startDate.getUTCDate() - 7);
            return { startDate, endDate };
        }
        case DATE_RANGE.LAST_MONTH: {
            const startDate = new Date(now);
            startDate.setUTCMonth(startDate.getUTCMonth() - 1);
            return { startDate, endDate };
        }
        case DATE_RANGE.LAST_3_MONTHS: {
            const startDate = new Date(now);
            startDate.setUTCMonth(startDate.getUTCMonth() - 3);
            return { startDate, endDate };
        }
        case DATE_RANGE.ALL_TIME:
        default:
            return { startDate: new Date(0), endDate };
    }
};
