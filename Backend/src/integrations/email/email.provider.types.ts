import {
    GmailMessageObjectFull,
    GmailOAuthAccessTokenResponse,
    GmailUserProfile,
    OutlookMessageObjectFull,
    OutlookOAuthAccessTokenResponse,
    OutlookUserProfile,
} from '@mailsense/types';
import { EmailInput } from '@modules/emails/database/index.js';
import { Readable } from 'stream';

export interface EmailSyncResult {
    addedEmails: EmailInput[] | Partial<EmailInput>[];
    deletedEmailIds: string[];
    newCursor: string;
}

export interface AttachmentStreamResult {
    stream: Readable;
    mimeType: string;
    filename: string;
    contentLength?: number;
}

export interface AccountBatchMoveTaskResult {
    accountId: string;
    successfulDbEmailIds: string[];
    count: number;
}

export type IEmailTAuthToken = GmailOAuthAccessTokenResponse | OutlookOAuthAccessTokenResponse;

export type IEmailTUserProfile = GmailUserProfile | OutlookUserProfile;

export type IEmailTSendEmailResult = Partial<GmailMessageObjectFull> | OutlookMessageObjectFull;
