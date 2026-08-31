'use client';

import { Mail } from 'lucide-react';
import React from 'react';

import { CustomPieTooltipProps } from '@features/analytics/types';

const AccountDistributionPieChartCustomTooltip: React.FC<CustomPieTooltipProps> = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const slice = payload[0]?.payload;
    if (!slice) {
        return null;
    }

    return (
        <div className="border-border/80 bg-popover/95 rounded-lg border p-2.5 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: slice.fill }} />
                <p className="text-foreground text-xs font-semibold">{slice.emailAddress}</p>
            </div>
            <div className="mt-2 flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Total Emails:
                    </span>
                    <span className="text-foreground font-semibold">{slice.value.toLocaleString()}</span>
                </div>
                <div className="border-border/60 text-foreground mt-1 flex items-center justify-between gap-4 border-t pt-1 font-medium">
                    <span className="text-muted-foreground">Share of Mailbox:</span>
                    <span className="font-bold">{slice.percentage.toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
};

export default AccountDistributionPieChartCustomTooltip;
