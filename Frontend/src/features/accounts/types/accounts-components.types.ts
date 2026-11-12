import { AccountAttributes } from '@mailsense/types';
import { ProviderAccountGroup } from './accounts-hooks.types';

export interface AccountCardProps {
    account: AccountAttributes;
}

export interface AccountSettingsModalProps {
    account: AccountAttributes;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export interface AccountCardActionButtonsProps {
    account: AccountAttributes;
}

export interface ProviderAccountListProps {
    groups: ProviderAccountGroup[];
    onConnectProvider: (provider: string) => void;
}

export interface AccountProviderIconProps {
    provider: string;
    className?: string;
}
