import { GMAIL_SECRETS } from '@config/config.js';
import { OAUTH_ACCESS_REDIRECT_URI, OAUTH_SCOPES } from '@constants/index.js';

// Build gmail oauth access consent url
export const buildGmailOAuthConsentURL = async () => {
    const params = new URLSearchParams({
        client_id: GMAIL_SECRETS.client_id,
        redirect_uri: GMAIL_SECRETS.redirect_uri,
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        scope: OAUTH_SCOPES.GMAIL,
    });
    return `${OAUTH_ACCESS_REDIRECT_URI?.GMAIL}?${params?.toString()}`;
};
