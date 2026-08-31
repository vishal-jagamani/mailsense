'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { AccountActivityGridProps } from '@features/analytics/types';
import { AccountProviderIcon } from '@entities/account';
import { DASHBOARD_LABELS, HOME_ROUTES } from '@shared/constants';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { Skeleton } from '@shared/ui/skeleton';
import { formatEpochToTimeAgo } from '@shared/utils/formatter';

export const AccountActivityGrid: React.FC<AccountActivityGridProps> = ({ accounts, isLoading }) => {
    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-5 w-48" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Card key={`acc-grid-skel-${index}`} className="border-border/60 bg-card/60 gap-4 p-5 shadow-xs">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="size-9 rounded-lg" />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3.5 w-20" />
                                    </div>
                                </div>
                                <Skeleton className="size-8 rounded-md" />
                            </div>
                            <div className="border-border/40 grid grid-cols-3 gap-3 border-t pt-3.5">
                                <Skeleton className="h-14 w-full rounded-xl" />
                                <Skeleton className="h-14 w-full rounded-xl" />
                                <Skeleton className="h-14 w-full rounded-xl" />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    const hasAccounts = Boolean(accounts && accounts.length > 0);

    return (
        <div className="space-y-3 select-none">
            <div>
                <h2 className="text-foreground text-base font-semibold">{DASHBOARD_LABELS.ACCOUNT_ACTIVITY.LABEL}</h2>
                <p className="text-muted-foreground text-xs">{DASHBOARD_LABELS.ACCOUNT_ACTIVITY.DESCRIPTION}</p>
            </div>

            {!hasAccounts ? (
                <Card className="border-border/60 bg-card/40 border-dashed p-6 text-center">
                    <p className="text-muted-foreground text-xs">{DASHBOARD_LABELS.ACCOUNT_ACTIVITY.NO_DATA}</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {accounts?.map((account) => {
                        return (
                            <Card
                                key={account.accountId}
                                className="group border-border/60 bg-card/60 hover:border-primary/40 relative flex flex-col justify-between gap-4 p-4 shadow-xs transition-all duration-200 hover:shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <AccountProviderIcon provider={account.provider} className="size-8 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-foreground truncate text-sm font-semibold" title={account.emailAddress}>
                                                {account.emailAddress}
                                            </p>
                                            <p className="text-muted-foreground truncate text-xs">
                                                {account.lastSyncedAt ? `Synced ${formatEpochToTimeAgo(account.lastSyncedAt)}` : 'Never synced'}
                                            </p>
                                        </div>
                                    </div>

                                    <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-primary h-8 w-8 shrink-0">
                                        <Link href={HOME_ROUTES.ACCOUNT_INBOX(account.accountId)} title="Open mailbox inbox">
                                            <ExternalLink className="h-4 w-4" />
                                            <span className="sr-only">Open Inbox</span>
                                        </Link>
                                    </Button>
                                </div>

                                <div className="border-border/40 grid grid-cols-3 gap-3 border-t pt-3.5 text-center">
                                    <div className="bg-muted/40 flex flex-col justify-center rounded-xl px-2 py-2.5">
                                        <span className="text-muted-foreground text-xs">Total</span>
                                        <p className="text-foreground text-base font-bold sm:text-lg">{account.totalEmails}</p>
                                    </div>
                                    <div className="bg-muted/40 flex flex-col justify-center rounded-xl px-2 py-2.5">
                                        <span className="text-muted-foreground text-xs">Unread</span>
                                        <p className="text-base font-bold text-sky-500 sm:text-lg">{account.unreadEmails}</p>
                                    </div>
                                    <div className="bg-muted/40 flex flex-col justify-center rounded-xl px-2 py-2.5">
                                        <span className="text-muted-foreground text-xs">Sent</span>
                                        <p className="text-base font-bold text-emerald-500 sm:text-lg">{account.sentEmails}</p>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
