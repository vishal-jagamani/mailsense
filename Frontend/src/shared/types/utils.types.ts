import { Filter, FilterOption } from '@mailsense/types';

export interface FilterModalProps {
    filter: Filter | null;
    onFilterChange: (filter: Filter) => void;
    filterOptions: FilterOption[];
}
