import { AccountAttributes } from '@mailsense/types';
import { AccountProviders } from '@shared/types';

export interface ProviderAccountGroup {
    provider: AccountProviders;
    accounts: AccountAttributes[];
}
