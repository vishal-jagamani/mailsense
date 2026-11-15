import { ANALYTICS_TIMEFRAME } from '@mailsense/types';
import { AccountDocument } from '@modules/accounts/database/index.js';
import { FlattenMaps } from 'mongoose';

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

export interface Count {
    count: number;
}

export interface RawOverviewFacetResult {
    totalEmails?: Array<Count>;
    unreadEmails?: Array<Count>;
    sentEmails?: Array<Count>;
    starredEmails?: Array<Count>;
    threads?: Array<Count>;
}

export interface RawOverviewAggregateResult {
    facetResult: RawOverviewFacetResult;
    draftsCount: number;
    allTimeTotalEmails?: number;
    periodEmailsCount?: number;
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

export interface EmailVolumeDataPointBase {
    receivedCount: number;
    sentCount: number;
}

export interface AccountEmailMetricsBase {
    totalEmails: number;
    unreadEmails: number;
    sentEmails: number;
}

export interface DashboardAnalyticsRawDataResponse {
    rawOverview: RawOverviewAggregateResult;
    rawPrevOverview: RawOverviewAggregateResult | null;
    rawVolume: RawVolumeDataPoint[];
    rawSenders: RawTopSendersResult;
    rawResponseTime: RawThreadResponseTimeSummary[];
    rawAccountBreakdown: RawAccountBreakdownResult;
    timeframe: ANALYTICS_TIMEFRAME;
}

export interface ParseSenderDisplayName {
    name: string;
    email: string;
}
