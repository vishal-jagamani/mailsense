// Account provider and oauth interfaces
export enum AccountProvider {
    GMAIL = 'gmail',
    OUTLOOK = 'outlook',
}

export interface GmailOAuthCallbackParams {
    code: string;
}

export interface GmailOAuthAccessTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}

export interface OutlookOAuthCallbackParams {
    code: string;
}

export interface OutlookOAuthAccessTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    ext_expires_in: number;
    refresh_token: string;
    scope: string;
}

//
