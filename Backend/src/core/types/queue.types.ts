export interface SyncAccountPayload {
    accountId: string;
    userId: string;
    force?: boolean;
}

export interface RefreshTokenPayload {
    accountId: string;
}

export interface EnqueueJobOptions {
    priority?: number;
    delay?: number;
    attempts?: number;
}
