import { OUTLOOK_SECRETS } from '@config/config.js';
import { OAUTH_ACCESS_REDIRECT_URI, OAUTH_SCOPES } from '@constants/index.js';

// Build outlook oauth access consent url
export const buildOutlookOAuthConsentURL = async () => {
    const params = new URLSearchParams({
        client_id: OUTLOOK_SECRETS.clientId,
        redirect_uri: OUTLOOK_SECRETS.redirectUri,
        response_type: 'code',
        response_mode: 'query',
        scope: OAUTH_SCOPES.OUTLOOK,
        prompt: 'select_account',
    });
    return `${OAUTH_ACCESS_REDIRECT_URI.OUTLOOK}?${params.toString()}`;
};
