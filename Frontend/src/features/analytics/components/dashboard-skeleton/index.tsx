'use client';

import React from 'react';

import { DashboardSkeletonProps } from '@features/analytics/types';
import { Card, CardContent, CardHeader } from '@shared/ui/card';
import { Skeleton } from '@shared/ui/skeleton';

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ className = '' }) => {
    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header Skeleton */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-44 rounded-lg" />
                    <Skeleton className="h-9 w-60 rounded-lg" />
                    <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
            </div>

            {/* 6 KPI Cards Skeleton */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={`page-kpi-skel-${index}`} className="border-border/60 bg-card/60 gap-1.5 p-3.5 py-2.5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-3.5 w-20" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                        <Skeleton className="h-7 w-16" />
                        <Skeleton className="h-3.5 w-24" />
                    </Card>
                ))}
            </div>

            {/* Volume Chart Skeleton */}
            <Card className="border-border/60 bg-card/60">
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3.5 w-72" />
                </CardHeader>
                <CardContent className="h-80 pt-4">
                    <Skeleton className="h-full w-full rounded-xl" />
                </CardContent>
            </Card>

            {/* 2-Column Response & Senders Grid Skeleton */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="border-border/60 bg-card/60">
                    <CardHeader className="pb-2">
                        <Skeleton className="h-5 w-44" />
                        <Skeleton className="h-3.5 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <Skeleton className="h-16 w-full rounded-xl" />
                            <Skeleton className="h-16 w-full rounded-xl" />
                        </div>
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/60">
                    <CardHeader className="pb-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-3.5 w-60" />
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={`page-senders-skel-${index}`} className="h-10 w-full" />
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
