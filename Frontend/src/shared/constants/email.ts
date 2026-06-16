import { DATE_RANGE } from '@shared/types';

export const EMAILS_PAGE_SIZE = 20;

export const DATE_RANGE_DROPDOWN_OPTIONS: { id: number; name: string; label: string }[] = [
    {
        id: 1,
        name: DATE_RANGE.TODAY,
        label: 'Today',
    },
    {
        id: 2,
        name: DATE_RANGE.LAST_WEEK,
        label: 'Last Week',
    },
    {
        id: 3,
        name: DATE_RANGE.LAST_MONTH,
        label: 'Last Month',
    },
    {
        id: 4,
        name: DATE_RANGE.LAST_3_MONTHS,
        label: 'Last 3 Months',
    },
    {
        id: 5,
        name: DATE_RANGE.ALL_TIME,
        label: 'All Time',
    },
] as const;
