'use client';

import { Check, ChevronDown, Mail } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { DashboardAccountFilterProps } from '@features/analytics/types';
import { ALL_ACCOUNTS_FILTER_ID, DASHBOARD_LABELS } from '@shared/constants';
import { Button } from '@shared/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/ui/dropdown-menu';

const DashboardAccountFilterDropdown: React.FC<DashboardAccountFilterProps> = ({ accounts, active, selectedAccountId, onSelectAccountId }) => {
    const [activeAccountLabel, setActiveAccountLabel] = useState<string>('');

    useEffect(() => {
        if (active) {
            setActiveAccountLabel(active);
        }
    }, [active]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-border/80 bg-card/60 h-9 gap-2 text-xs font-medium backdrop-blur-sm">
                    <Mail className="text-primary h-3.5 w-3.5" />
                    <span className="max-w-37.5 truncate md:max-w-50">{activeAccountLabel}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={() => onSelectAccountId(ALL_ACCOUNTS_FILTER_ID)} className="flex items-center justify-between text-xs">
                    <span>{DASHBOARD_LABELS.ALL_ACCOUNTS_CONNECTED}</span>
                    {selectedAccountId === ALL_ACCOUNTS_FILTER_ID && <Check className="text-primary h-3.5 w-3.5" />}
                </DropdownMenuItem>
                {accounts.map((account) => (
                    <DropdownMenuItem
                        key={account._id}
                        onClick={() => onSelectAccountId(account._id)}
                        className="flex items-center justify-between text-xs"
                    >
                        <span className="truncate">{account.emailAddress}</span>
                        {selectedAccountId === account._id && <Check className="text-primary h-3.5 w-3.5" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default DashboardAccountFilterDropdown;
