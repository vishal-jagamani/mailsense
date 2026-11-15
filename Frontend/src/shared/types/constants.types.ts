import { ChartSeriesConfig } from '@features/analytics/types';
import { LucideIcon } from 'lucide-react';

export interface VolumeChartSeries {
    RECEIVED: ChartSeriesConfig;
    SENT: ChartSeriesConfig;
}

export interface DateRangeOption {
    id: number;
    name: string;
    label: string;
}

export interface SettingOption {
    id: number;
    name: string;
    title: string;
    link: string;
    icon: LucideIcon;
}
