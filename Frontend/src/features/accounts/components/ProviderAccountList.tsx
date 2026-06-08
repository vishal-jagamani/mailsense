'use client';

import { Plus } from 'lucide-react';

import { AccountProviderIcon } from '@entities/account';
import { Card, CardContent } from '@shared/ui/card';
import type { ProviderAccountGroup } from '../hooks/useGroupedProviderAccounts';
import AccountCard from './account-card';

interface ProviderAccountListProps {
    groups: ProviderAccountGroup[];
    onConnectProvider: (provider: string) => void;
}

const ProviderAccountList: React.FC<ProviderAccountListProps> = ({ groups, onConnectProvider }) => {
    if (!groups.length) {
        return null;
    }

    return (
        <div className="flex flex-col gap-10 select-none">
            {groups.map(({ provider, accounts }) => (
                <div key={provider.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-1">
                        <AccountProviderIcon provider={provider.name} className="size-6" />
                        <p className="text-lg font-semibold">{provider.displayName}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {accounts.map((account) => (
                            <AccountCard key={account._id} account={account} />
                        ))}

                        <Card
                            className="hover:bg-muted bg-background h-16 cursor-pointer border-2 border-dashed py-4"
                            onClick={() => onConnectProvider(provider.name)}
                        >
                            <CardContent className="flex h-full items-center gap-1">
                                <Plus size={18} />
                                <p className="text-sm font-semibold">Add Account</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProviderAccountList;
