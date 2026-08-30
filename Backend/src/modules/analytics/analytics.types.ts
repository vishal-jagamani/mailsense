import { FlattenMaps } from 'mongoose';
import { AccountDocument } from '../accounts/account.model.js';

export interface AccountEmailMetricsResult {
    totalEmails: number;
    unreadCount: number;
    sentCount: number;
    totalThreads: number;
}

export interface DateRangeBoundary {
    startDate: Date;
    endDate: Date;
    prevStartDate?: Date;
    prevEndDate?: Date;
}

export interface RawOverviewFacetResult {
    totalEmails?: Array<{ count: number }>;
    unreadEmails?: Array<{ count: number }>;
    sentEmails?: Array<{ count: number }>;
    starredEmails?: Array<{ count: number }>;
    threads?: Array<{ count: number }>;
}

export interface RawOverviewAggregateResult {
    facetResult: RawOverviewFacetResult;
    draftsCount: number;
}

export interface RawVolumeDataPoint {
    _id: string;
    receivedCount: number;
    sentCount: number;
}

export interface RawSenderDataPoint {
    _id: string;
    count: number;
    lastReceivedAt: Date;
}

export interface RawTopSendersResult {
    senders: RawSenderDataPoint[];
    totalIncoming: number;
}

export interface RawThreadResponseTimeSummary {
    _id: string;
    firstReceivedAt: Date | null;
    firstSentAt: Date | null;
    hasReceived: boolean;
    hasSent: boolean;
}

export interface RawAccountEmailStats {
    _id: string;
    totalEmails: number;
    unreadEmails: number;
    sentEmails: number;
}

export interface RawAccountBreakdownResult {
    accounts: Array<FlattenMaps<AccountDocument>>;
    emailStats: RawAccountEmailStats[];
}
