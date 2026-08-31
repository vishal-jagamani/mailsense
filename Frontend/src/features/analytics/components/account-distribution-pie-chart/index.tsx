'use client';

import React, { useMemo } from 'react';
import { Label, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { AccountDistributionPieChartProps, AccountPieSliceData } from '@features/analytics/types';
import { ACCOUNT_PIE_CHART_COLORS, ALL_ACCOUNTS_FILTER_ID, DASHBOARD_LABELS } from '@shared/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Skeleton } from '@shared/ui/skeleton';
import AccountDistributionPieChartCustomTooltip from './AccountDistributionPieChartCustomTooltip';

export const AccountDistributionPieChart: React.FC<AccountDistributionPieChartProps> = ({ accounts, selectedAccountId, isLoading }) => {
    const chartData: AccountPieSliceData[] = useMemo(() => {
        if (!accounts || accounts.length === 0) {
            return [];
        }

        const filteredAccounts =
            selectedAccountId && selectedAccountId !== ALL_ACCOUNTS_FILTER_ID
                ? accounts.filter((acc) => acc.accountId === selectedAccountId)
                : accounts;

        const targetList = filteredAccounts.length > 0 ? filteredAccounts : accounts;
        const totalSum = targetList.reduce((acc, curr) => acc + (curr.totalEmails || 0), 0);

        return targetList.map((account, index) => {
            const value = account.totalEmails || 0;
            const percentage = totalSum > 0 ? (value / totalSum) * 100 : targetList.length === 1 ? 100 : 0;
            const fill = ACCOUNT_PIE_CHART_COLORS[index % ACCOUNT_PIE_CHART_COLORS.length];

            return {
                name: account.emailAddress,
                emailAddress: account.emailAddress,
                value,
                provider: account.provider,
                percentage,
                fill,
            };
        });
    }, [accounts, selectedAccountId]);

    const totalEmails = useMemo(() => {
        return chartData.reduce((acc, curr) => acc + curr.value, 0);
    }, [chartData]);

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

    const hasData = chartData.length > 0 && chartData.some((slice) => slice.value > 0);

    return (
        <Card className="border-border/60 bg-card/60 p-4 px-0 shadow-xs select-none">
            <CardHeader className="gap-1">
                <CardTitle className="text-foreground text-base font-semibold">{DASHBOARD_LABELS.ACCOUNT_DISTRIBUTION_PIE_CHART.LABEL}</CardTitle>
                <CardDescription className="text-muted-foreground text-xs">
                    {DASHBOARD_LABELS.ACCOUNT_DISTRIBUTION_PIE_CHART.DESCRIPTION}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                {!hasData ? (
                    <div className="border-border/60 flex h-56 flex-col items-center justify-center rounded-xl border border-dashed text-center">
                        <p className="text-muted-foreground text-xs font-medium">{DASHBOARD_LABELS.ACCOUNT_DISTRIBUTION_PIE_CHART.NO_DATA}</p>
                    </div>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center md:flex-row">
                        <div className="h-52 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <Tooltip content={<AccountDistributionPieChartCustomTooltip />} />
                                    <Pie
                                        data={chartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={100}
                                        paddingAngle={chartData.length > 1 ? 4 : 0}
                                        stroke="var(--card)"
                                    >
                                        <Label
                                            content={({ viewBox }) => {
                                                if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                                    return (
                                                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={(viewBox.cy || 0) - 4}
                                                                className="fill-foreground text-2xl font-semibold"
                                                            >
                                                                {totalEmails.toLocaleString()}
                                                            </tspan>
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={(viewBox.cy || 0) + 14}
                                                                className="fill-muted-foreground text-sm font-medium"
                                                            >
                                                                Emails
                                                            </tspan>
                                                        </text>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Cleanly Aligned 2-Column Legend Grid */}
                        <div className="mt-2 flex flex-col gap-x-6 gap-y-3 px-6">
                            {chartData.map((slice) => (
                                <div key={slice.emailAddress} className="flex items-center justify-between gap-2 text-xs">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.fill }} />
                                        <span className="text-muted-foreground truncate text-[11px] font-medium" title={slice.emailAddress}>
                                            {slice.emailAddress}
                                        </span>
                                    </div>
                                    <span className="text-foreground shrink-0 text-[11px] font-semibold">({slice.percentage.toFixed(0)}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AccountDistributionPieChart;
