export enum FilterOptionType {
    STRING = 'string',
    TOGGLE = 'toggle',
    DROPDOWN = 'dropdown',
}

export enum DATE_RANGE {
    TODAY = 'today',
    LAST_WEEK = 'last_week',
    LAST_MONTH = 'last_month',
    LAST_3_MONTHS = 'last_3_months',
    ALL_TIME = 'all_time',
}

export interface Filter {
    searchText?: string | undefined;
    accountId?: string[] | undefined;
    dateRange?: DATE_RANGE | undefined;
    folders?: string[] | undefined;
    unread?: boolean;
}

interface FilterOptionData {
    id: string;
    name: string;
    label: string;
    selectedValue: string | boolean;
    provider?: string;
}

export interface FilterOption {
    id: number;
    name: string;
    label: string;
    type: FilterOptionType;
    data: FilterOptionData[] | FilterOptionData;
}
