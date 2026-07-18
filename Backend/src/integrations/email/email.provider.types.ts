import { GmailMessageObjectFull, GmailUserProfile } from '@integrations/gmail/gmail.types.js';
import { OutlookMessageObjectFull, OutlookUserProfile } from '@integrations/outlook/outlook.types.js';
import { EmailInput } from '@modules/emails/email.model.js';
import { GmailOAuthAccessTokenResponse, OutlookOAuthAccessTokenResponse } from '@types';

export interface EmailSyncResult {
    addedEmails: EmailInput[] | Partial<EmailInput>[];
    deletedEmailIds: string[];
    newCursor: string;
}

export type IEmailTAuthToken = GmailOAuthAccessTokenResponse | OutlookOAuthAccessTokenResponse;

export type IEmailTUserProfile = GmailUserProfile | OutlookUserProfile;

export type IEmailTSendEmailResult = Partial<GmailMessageObjectFull> | OutlookMessageObjectFull;
