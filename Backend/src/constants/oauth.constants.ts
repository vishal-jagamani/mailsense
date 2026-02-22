export const OAUTH_SCOPES = {
    GMAIL: ['https://mail.google.com/', 'openid', 'email', 'profile'].join(' '),
    OUTLOOK: ['Mail.Read', 'Mail.ReadWrite', 'Mail.Send', 'offline_access', 'User.Read', 'openid', 'profile', 'email'].join(' '),
};

export const OAUTH_ACCESS_REDIRECT_URI = {
    GMAIL: 'https://accounts.google.com/o/oauth2/v2/auth',
    OUTLOOK: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
};

export const OAUTH_ACCESS_TOKEN_URI = {
    GMAIL: 'https://oauth2.googleapis.com/token',
    OUTLOOK: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
};
