'use client';

import { Clock, Timer, Zap } from 'lucide-react';
import React, { useMemo } from 'react';

import { ResponseDistributionBucket, ResponseTimeCardProps } from '@features/analytics/types';
import { formatMinutesToReadableString } from '@features/analytics/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Skeleton } from '@shared/ui/skeleton';
import { DASHBOARD_LABELS } from '@shared/constants';

export const ResponseTimeCard: React.FC<ResponseTimeCardProps> = ({ responseTime, isLoading }) => {
    const distributionBuckets: ResponseDistributionBucket[] = useMemo(() => {
        const dist = responseTime?.distribution;
        const total = responseTime?.totalRepliesAnalyzed || 1;

        const u1 = dist?.under1Hour || 0;
        const b1to4 = dist?.between1And4Hours || 0;
        const b4to24 = dist?.between4And24Hours || 0;
        const o24 = dist?.over24Hours || 0;

        return [
            {
                label: '< 1 hour',
                count: u1,
                percentage: Math.round((u1 / total) * 100) || 0,
                colorClass: 'text-emerald-500',
                bgClass: 'bg-emerald-500',
            },
            {
                label: '1 - 4 hours',
                count: b1to4,
                percentage: Math.round((b1to4 / total) * 100) || 0,
                colorClass: 'text-sky-500',
                bgClass: 'bg-sky-500',
            },
            {
                label: '4 - 24 hours',
                count: b4to24,
                percentage: Math.round((b4to24 / total) * 100) || 0,
                colorClass: 'text-amber-500',
                bgClass: 'bg-amber-500',
            },
            {
                label: '> 24 hours',
                count: o24,
                percentage: Math.round((o24 / total) * 100) || 0,
                colorClass: 'text-rose-500',
                bgClass: 'bg-rose-500',
            },
        ];
    }, [responseTime]);

    if (isLoading) {
        return (
            <Card className="border-border/60 bg-card/60 shadow-xs">
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-44" />
                    <Skeleton className="h-3.5 w-64" />
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-16 w-full rounded-xl" />
                        <Skeleton className="h-16 w-full rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={`resp-skel-${index}`} className="h-6 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/60 bg-card/60 p-4 px-0 shadow-xs select-none">
            <CardHeader className="gap-1">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground text-base font-semibold">{DASHBOARD_LABELS.RESPONSE_TIME_CARD.LABEL}</CardTitle>
                    <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
                        <Zap className="h-3 w-3" />
                        {responseTime?.responseRatePercentage ?? 0}% Rate
                    </span>
                </div>
                <CardDescription className="text-muted-foreground text-xs">{DASHBOARD_LABELS.RESPONSE_TIME_CARD.DESCRIPTION}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="border-border/60 bg-muted/30 flex flex-col gap-1 rounded-xl border p-3">
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                            <Clock className="h-3.5 w-3.5 text-indigo-500" />
                            {DASHBOARD_LABELS.RESPONSE_TIME_CARD.AVERAGE_REPLY}
                        </div>
                        <span className="text-foreground text-lg font-bold">
                            {formatMinutesToReadableString(responseTime?.averageResponseMinutes)}
                        </span>
                    </div>

                    <div className="border-border/60 bg-muted/30 flex flex-col gap-1 rounded-xl border p-3">
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                            <Timer className="h-3.5 w-3.5 text-emerald-500" />
                            {DASHBOARD_LABELS.RESPONSE_TIME_CARD.MEDIAN_REPLY}
                        </div>
                        <span className="text-foreground text-lg font-bold">
                            {formatMinutesToReadableString(responseTime?.medianResponseMinutes)}
                        </span>
                    </div>
                </div>

                {/* Response Distribution Progress Bars */}
                <div className="space-y-3">
                    <div className="text-muted-foreground flex items-center justify-between text-xs font-medium">
                        <span>{DASHBOARD_LABELS.RESPONSE_TIME_CARD.TURNAROUND_DISTRIBUTION}</span>
                        <span>
                            {responseTime?.totalRepliesAnalyzed || 0} {DASHBOARD_LABELS.RESPONSE_TIME_CARD.TOTAL_REPLIES_ANALYZED}
                        </span>
                    </div>

                    <div className="space-y-2.5">
                        {distributionBuckets.map((bucket) => (
                            <div key={bucket.label} className="space-y-2">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-foreground font-medium">{bucket.label}</span>
                                    <span className="text-muted-foreground">
                                        {bucket.count} ({bucket.percentage}%)
                                    </span>
                                </div>
                                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                                    <div
                                        className={`h-full rounded-full ${bucket.bgClass} transition-all duration-500`}
                                        style={{ width: `${bucket.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
