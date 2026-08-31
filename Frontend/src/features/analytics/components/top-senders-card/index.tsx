'use client';

import { Award, Mail, Users } from 'lucide-react';
import React from 'react';

import { TopSendersCardProps } from '@features/analytics/types';
import { getTopSenderInitials } from '@features/analytics/utils';
import { DASHBOARD_LABELS } from '@shared/constants';
import { Avatar, AvatarFallback } from '@shared/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Skeleton } from '@shared/ui/skeleton';

export const TopSendersCard: React.FC<TopSendersCardProps> = ({ senders, isLoading }) => {
    if (isLoading) {
        return (
            <Card className="border-border/60 bg-card/60 shadow-xs">
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3.5 w-60" />
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={`sender-skel-${index}`} className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-3.5 w-32" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                            <Skeleton className="h-4 w-12" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    const hasSenders = Boolean(senders && senders.length > 0);

    return (
        <Card className="border-border/60 bg-card/60 shadow-xs p-4 px-0 select-none">
            <CardHeader className="gap-1">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground text-base font-semibold">{DASHBOARD_LABELS.TOP_SENDERS_CARD.LABEL}</CardTitle>
                    <Users className="text-muted-foreground h-4 w-4" />
                </div>
                <CardDescription className="text-muted-foreground text-xs">{DASHBOARD_LABELS.TOP_SENDERS_CARD.DESCRIPTION}</CardDescription>
            </CardHeader>

            <CardContent>
                {!hasSenders ? (
                    <div className="border-border/60 flex h-50 flex-col items-center justify-center rounded-xl border border-dashed text-center">
                        <Mail className="text-muted-foreground/50 h-6 w-6" />
                        <p className="text-muted-foreground mt-2 text-xs font-medium">{DASHBOARD_LABELS.TOP_SENDERS_CARD.NO_DATA}</p>
                    </div>
                ) : (
                    <div className="divide-border/40 divide-y">
                        {senders?.map((sender, index) => (
                            <div key={sender.email} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="border-border/60 size-8 border">
                                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                                {getTopSenderInitials(sender.name || sender.email)}
                                            </AvatarFallback>
                                        </Avatar>
                                        {index === 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                                                <Award className="h-2.5 w-2.5" />
                                            </span>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-foreground truncate text-xs font-medium">{sender.name || sender.email}</p>
                                        <p className="text-muted-foreground truncate text-[11px]">{sender.email}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                    <span className="bg-muted text-foreground rounded-md px-2 py-0.5 text-xs font-bold">{sender.count} msgs</span>
                                    <span className="text-muted-foreground text-[10px]">{sender.percentage}% share</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
