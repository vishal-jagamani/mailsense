import { EmailInput } from '@modules/emails/email.model.js';
import { GmailUserProfile } from 'integrations/gmail/gmail.types.js';
import { OutlookUserProfile } from 'integrations/outlook/outlook.types.js';
import { Types, ProjectionType } from 'mongoose';
import { AccountDocument } from './account.model.js';

// Model types
export enum ACCOUNT_LAST_SYNC_STATUS {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
}

export interface AccountAttributes {
    userId: string;
    provider: string;
    emailAddress: string;
    userProfileDetails: GmailUserProfile | OutlookUserProfile;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: number;
    refreshTokenExpiry: number;
    scope: string;
    syncEnabled: boolean;
    syncInterval: number;
    lastSyncedAt: number;
    lastSyncCursor: string;
    active: boolean;
    syncInProgress: boolean;
    lastSyncStatus?: ACCOUNT_LAST_SYNC_STATUS;
    lastSyncError?: string;
    lastSyncStartedAt?: number;
    lastSyncCompletedAt?: number;
}

export interface AccountMetricsAttributes {
    accountId: string;
    totalEmails: number;
    totalThreads: number;
    totalLabels: number;
    totalFolders: number;
    totalContacts: number;
    date: Date;
}

export enum ACCOUNT_SYNC_JOB_STATUS {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum ACCOUNT_SYNC_JOB_TRIGGER_TYPE {
    MANUAL = 'MANUAL',
    SCHEDULED = 'SCHEDULED',
}

export interface SyncJobAttributes {
    accountId: Types.ObjectId;
    bullJobId: string;
    status: ACCOUNT_SYNC_JOB_STATUS;
    triggerType: ACCOUNT_SYNC_JOB_TRIGGER_TYPE;
    startedAt: number;
    completedAt?: number;
    addedEmailsCount: number;
    deletedEmailsCount: number;
    errorMessage?: string;
    errorStack?: string;
}

// DB Field Mapping
export interface AccountFetchAccessTokenDBMapping {
    FETCH_ACCESS_TOKEN: { projection: ProjectionType<AccountDocument> };
}

export interface GetAccountEmailsResponse {
    emails: EmailInput[];
    lastSyncCursor: string;
}
