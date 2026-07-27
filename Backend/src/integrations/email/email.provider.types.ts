import {
    GmailMessageObjectFull,
    GmailOAuthAccessTokenResponse,
    GmailUserProfile,
    OutlookMessageObjectFull,
    OutlookOAuthAccessTokenResponse,
    OutlookUserProfile,
} from '@mailsense/types';
import { EmailInput } from '@modules/emails/email.model.js';

export interface EmailSyncResult {
    addedEmails: EmailInput[] | Partial<EmailInput>[];
    deletedEmailIds: string[];
    newCursor: string;
}

export type IEmailTAuthToken = GmailOAuthAccessTokenResponse | OutlookOAuthAccessTokenResponse;

export type IEmailTUserProfile = GmailUserProfile | OutlookUserProfile;

export type IEmailTSendEmailResult = Partial<GmailMessageObjectFull> | OutlookMessageObjectFull;
