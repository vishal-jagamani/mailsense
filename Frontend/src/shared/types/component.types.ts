import { AccountProviders } from './common.types';

export interface PageHeaderProps {
    title: string;
    button?: boolean;
    dropdownOptions?: AccountProviders[];
    dropdownMenuItemClick?: (dropdownOption: AccountProviders) => void;
}

export interface PaginationProps {
    total: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSize?: number;
}

export interface LoaderProps {
    type?: 'api' | 'page';
}

export interface TextInputProps {
    label: string;
    value: string;
    type?: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

export interface SearchHeaderProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

export interface APILoaderProps {
    show: boolean;
    size?: 'xs' | 'small' | 'medium' | 'large';
}
