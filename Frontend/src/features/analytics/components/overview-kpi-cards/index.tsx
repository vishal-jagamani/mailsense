'use client';

import { FileText, Inbox, Mail, MailCheck, Minus, Send, Star, TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';

import { MetricCardConfig, OverviewKpiCardsProps } from '@features/analytics/types';
import { Card } from '@shared/ui/card';
import { Skeleton } from '@shared/ui/skeleton';

export const OverviewKpiCards: React.FC<OverviewKpiCardsProps> = ({ overview, isLoading }) => {
    const formatMetricNumber = (value: number | undefined): string => {
        try {
            if (value === undefined || value === null) {
                return '0';
            }
            return new Intl.NumberFormat('en-US').format(value);
        } catch (error) {
            console.error('Failed to format metric number', error);
            return String(value ?? 0);
        }
    };

    const cards: MetricCardConfig[] = React.useMemo(() => {
        return [
            {
                id: 'total-emails',
                title: 'Total Emails',
                value: formatMetricNumber(overview?.totalEmails),
                icon: Mail,
                iconColor: 'text-indigo-500',
                iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
                changePercentage: overview?.emailsChangePercentage,
            },
            {
                id: 'unread-emails',
                title: 'Unread Messages',
                value: formatMetricNumber(overview?.unreadEmails),
                icon: Inbox,
                iconColor: 'text-sky-500',
                iconBg: 'bg-sky-500/10 dark:bg-sky-500/20',
                changePercentage: overview?.unreadChangePercentage,
            },
            {
                id: 'sent-emails',
                title: 'Sent Emails',
                value: formatMetricNumber(overview?.sentEmails),
                icon: Send,
                iconColor: 'text-emerald-500',
                iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
                changePercentage: overview?.sentChangePercentage,
            },
            {
                id: 'starred-emails',
                title: 'Starred Items',
                value: formatMetricNumber(overview?.starredEmails),
                icon: Star,
                iconColor: 'text-amber-500',
                iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
            },
            {
                id: 'draft-messages',
                title: 'Draft Messages',
                value: formatMetricNumber(overview?.draftsCount),
                icon: FileText,
                iconColor: 'text-purple-500',
                iconBg: 'bg-purple-500/10 dark:bg-purple-500/20',
            },
            {
                id: 'active-mailboxes',
                title: 'Active Mailboxes',
                value: formatMetricNumber(overview?.activeAccountsCount),
                icon: MailCheck,
                iconColor: 'text-teal-500',
                iconBg: 'bg-teal-500/10 dark:bg-teal-500/20',
                subtitle: `${formatMetricNumber(overview?.totalThreadsCount)} threads active`,
            },
        ];
    }, [overview]);

    const renderTrendChip = (changePercentage: number | undefined): React.ReactNode => {
        if (changePercentage === undefined || changePercentage === null) {
            return null;
        }

        if (changePercentage > 0) {
            return (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <TrendingUp className="h-3 w-3" />+{changePercentage}%
                </span>
            );
        }

        if (changePercentage < 0) {
            return (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                    <TrendingDown className="h-3 w-3" />
                    {changePercentage}%
                </span>
            );
        }

        return (
            <span className="bg-muted text-muted-foreground inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                <Minus className="h-3 w-3" />
                0%
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={`kpi-skeleton-${index}`} className="border-border/60 bg-card/60 gap-1.5 p-3.5 py-2.5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-3.5 w-20" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                        <Skeleton className="h-7 w-16" />
                        <Skeleton className="h-3.5 w-24" />
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4 select-none sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6">
            {cards.map((card) => {
                const IconComponent = card.icon;
                return (
                    <Card
                        key={card.id}
                        className="group border-border/60 bg-card/60 hover:border-primary/30 relative gap-2 overflow-hidden p-3.5 py-2.5 shadow-xs transition-all duration-200 hover:shadow-md"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-xs font-medium">{card.title}</span>
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.iconBg} ${card.iconColor}`}>
                                <IconComponent className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="flex items-baseline">
                            <span className="text-foreground text-2xl font-bold tracking-tight">{card.value}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {card.changePercentage !== undefined ? (
                                <>
                                    {renderTrendChip(card.changePercentage)}
                                    <span className="text-muted-foreground text-[10px]">vs prev period</span>
                                </>
                            ) : card.subtitle ? (
                                <span className="text-muted-foreground text-[10px]">{card.subtitle}</span>
                            ) : (
                                <span className="text-muted-foreground/60 text-[10px]">Current snapshot</span>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};
