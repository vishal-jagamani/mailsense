import { ACCOUNT_PROVIDER } from '@mailsense/types';
import { ProjectionType } from 'mongoose';
import { AccountDocument } from './account.model.js';

// DB Field Mapping
export interface AccountFetchAccessTokenDBMapping {
    FETCH_ACCESS_TOKEN: { projection: ProjectionType<AccountDocument> };
}

export interface OAuthCallbackResult {
    readonly accountId: string;
    readonly isNew: boolean;
}

export interface OAuthConnectResponse {
    readonly url: string;
}

export interface OAuthCallbackParams {
    readonly code: string;
    readonly state: string;
}

export interface ProcessAccountTokensParams {
    readonly userId: string;
    readonly provider: ACCOUNT_PROVIDER;
    readonly emailAddress: string;
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly tokenExpiry: number;
    readonly scope?: string;
    readonly userProfileDetails?: Record<string, unknown>;
}

export interface SyncAccountsResponse {
    readonly status: boolean;
    readonly message: string;
    readonly jobIds: string[];
}

export interface SyncAccountJobResponse {
    readonly status: boolean;
    readonly message: string;
    readonly jobId?: string;
}
