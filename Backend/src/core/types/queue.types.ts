import { ACCOUNT_SYNC_JOB_TRIGGER_TYPE } from '@mailsense/types';

export interface SyncAccountPayload {
    accountId: string;
    userId: string;
    force?: boolean;
    triggerType?: ACCOUNT_SYNC_JOB_TRIGGER_TYPE;
}

export interface RefreshTokenPayload {
    accountId: string;
}

export interface EnqueueJobOptions {
    priority?: number;
    delay?: number;
    attempts?: number;
}
