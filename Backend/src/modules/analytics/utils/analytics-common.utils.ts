import { ResponseTimeDistributionAttributes } from '@mailsense/types';
import { Count, ParseSenderDisplayName } from '../types/index.js';

export const calculatePercentile = (values: number[], percentile: number): number => {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
};

export const computeMedian = (sortedNumbers: number[]): number => {
    if (!sortedNumbers || sortedNumbers.length === 0) return 0;
    const midIndex = Math.floor(sortedNumbers.length / 2);
    if (sortedNumbers.length % 2 !== 0) {
        return sortedNumbers[midIndex];
    }
    return Math.round((sortedNumbers[midIndex - 1] + sortedNumbers[midIndex]) / 2);
};

export const calculateMovingAverage = (data: number[], windowSize: number): number[] => {
    if (!data || data.length === 0 || windowSize <= 0) return [];
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - windowSize + 1);
        const slice = data.slice(start, i + 1);
        const sum = slice.reduce((acc, curr) => acc + curr, 0);
        result.push(Math.round(sum / slice.length));
    }
    return result;
};

export const formatDurationMs = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remSeconds = seconds % 60;
    return `${minutes}m ${remSeconds}s`;
};

export const recordDistributionBucket = (distribution: ResponseTimeDistributionAttributes, deltaMinutes: number): void => {
    if (deltaMinutes < 60) {
        distribution.under1Hour++;
    } else if (deltaMinutes <= 240) {
        distribution.between1And4Hours++;
    } else if (deltaMinutes <= 1440) {
        distribution.between4And24Hours++;
    } else {
        distribution.over24Hours++;
    }
};

export const extractFacetCount = (buckets?: Count[]): number => {
    if (!buckets || buckets.length === 0) {
        return 0;
    }
    return buckets[0].count;
};

export const parseSenderDisplayName = (rawFrom: string): ParseSenderDisplayName => {
    const match = /^(.*?)\s*<(.+?)>$/.exec(rawFrom);
    if (match) {
        return {
            name: match[1].replace(/["']/g, '').trim() || match[2],
            email: match[2].trim(),
        };
    }
    return { name: rawFrom, email: rawFrom };
};
