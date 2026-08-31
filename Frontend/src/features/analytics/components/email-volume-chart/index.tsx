'use client';

import React from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { EmailVolumeChartProps } from '@features/analytics/types';
import { DASHBOARD_LABELS, VOLUME_CHART_SERIES } from '@shared/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Skeleton } from '@shared/ui/skeleton';
import EmailVolumeChartCustomTooltip from './EmailVolumeChartCustomTooltip';
import { formatEmailVolumeChartXAxisDate } from '@shared/utils/formatter';

export const EmailVolumeChart: React.FC<EmailVolumeChartProps> = ({ volumeData, timeframe, isLoading }) => {
    if (isLoading) {
        return (
            <Card className="border-border/60 bg-card/60 shadow-xs">
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3.5 w-72" />
                </CardHeader>
                <CardContent className="h-56 pt-4">
                    <Skeleton className="h-full w-full rounded-xl" />
                </CardContent>
            </Card>
        );
    }

    const hasData = Boolean(volumeData && volumeData.length > 0 && volumeData.some((point) => point.totalCount > 0));

    return (
        <Card className="border-border/60 bg-card/60 p-4 px-0 shadow-xs select-none">
            <CardHeader className="gap-1">
                <CardTitle className="text-foreground text-base font-semibold">{DASHBOARD_LABELS.EMAIL_VOLUME_CHART.LABEL}</CardTitle>
                <CardDescription className="text-muted-foreground text-xs">{DASHBOARD_LABELS.EMAIL_VOLUME_CHART.DESCRIPTION}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                {!hasData ? (
                    <div className="border-border/60 flex h-72 flex-col items-center justify-center rounded-xl border border-dashed text-center">
                        <p className="text-muted-foreground text-xs font-medium">{DASHBOARD_LABELS.EMAIL_VOLUME_CHART.NO_DATA}</p>
                    </div>
                ) : (
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={volumeData} margin={{ top: -20, right: 0, left: -40, bottom: -10 }}>
                                <defs>
                                    <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={VOLUME_CHART_SERIES.RECEIVED.strokeColor} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={VOLUME_CHART_SERIES.RECEIVED.strokeColor} stopOpacity={0.0} />
                                    </linearGradient>
                                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={VOLUME_CHART_SERIES.SENT.strokeColor} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={VOLUME_CHART_SERIES.SENT.strokeColor} stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="var(--border)" opacity={0.4} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(date) => formatEmailVolumeChartXAxisDate(date, timeframe)}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                                />
                                <Tooltip content={<EmailVolumeChartCustomTooltip />} />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey={VOLUME_CHART_SERIES.RECEIVED.key}
                                    name={VOLUME_CHART_SERIES.RECEIVED.label}
                                    stroke={VOLUME_CHART_SERIES.RECEIVED.strokeColor}
                                    fillOpacity={1}
                                    fill="url(#colorReceived)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey={VOLUME_CHART_SERIES.SENT.key}
                                    name={VOLUME_CHART_SERIES.SENT.label}
                                    stroke={VOLUME_CHART_SERIES.SENT.strokeColor}
                                    fillOpacity={1}
                                    fill="url(#colorSent)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
