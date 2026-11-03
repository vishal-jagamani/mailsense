import { AccountProviders } from '@entities/account';

export interface PageHeaderProps {
    title: string;
    button?: boolean;
    dropdownOptions?: AccountProviders[];
    dropdownMenuItemClick?: (dropdownOption: AccountProviders) => void;
}
