'use client';

import { MailPlus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { DashboardEmptyStateProps } from '@features/analytics/types';
import { ROUTES } from '@shared/constants';
import { Button } from '@shared/ui/button';
import { Card, CardContent } from '@shared/ui/card';

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
    title = 'No Email Accounts Connected',
    description = 'Connect your Gmail or Outlook mailbox to automatically generate productivity analytics, email volume trends, and turnaround insights.',
    onConnectAccount,
}) => {
    return (
        <Card className="border-border/80 bg-card/40 flex min-h-105 flex-col items-center justify-center border-dashed p-8 text-center backdrop-blur-sm">
            <CardContent className="flex max-w-md flex-col items-center gap-4 p-0">
                <div className="bg-primary/10 text-primary ring-primary/5 dark:bg-primary/20 flex h-14 w-14 items-center justify-center rounded-2xl ring-8">
                    <Sparkles className="h-7 w-7" />
                </div>

                <div className="space-y-1.5">
                    <h3 className="text-foreground text-lg font-bold">{title}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
                </div>

                <div className="mt-2">
                    {onConnectAccount ? (
                        <Button onClick={onConnectAccount} className="gap-2">
                            <MailPlus className="h-4 w-4" />
                            Connect Mailbox
                        </Button>
                    ) : (
                        <Button asChild className="gap-2">
                            <Link href={ROUTES.ACCOUNTS}>
                                <MailPlus className="h-4 w-4" />
                                Connect Mailbox
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
