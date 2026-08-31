'use client';

import React from 'react';

import { CustomVolumeTooltipProps } from '@features/analytics/types';

const EmailVolumeChartCustomTooltip: React.FC<CustomVolumeTooltipProps> = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const receivedItem = payload.find((item) => item.dataKey === 'receivedCount');
    const sentItem = payload.find((item) => item.dataKey === 'sentCount');
    const receivedCount = receivedItem?.value ?? 0;
    const sentCount = sentItem?.value ?? 0;
    const total = receivedCount + sentCount;

    return (
        <div className="border-border/80 bg-popover/95 rounded-lg border p-2 shadow-lg backdrop-blur-md">
            <p className="text-foreground text-xs font-semibold">{label}</p>
            <div className="mt-2 flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        Received:
                    </span>
                    <span className="text-foreground font-semibold">{receivedCount}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Sent:
                    </span>
                    <span className="text-foreground font-semibold">{sentCount}</span>
                </div>
                <div className="border-border/60 text-foreground mt-1 flex items-center justify-between gap-4 border-t pt-1 font-bold">
                    <span>Total Volume:</span>
                    <span>{total}</span>
                </div>
            </div>
        </div>
    );
};

export default EmailVolumeChartCustomTooltip;
