export interface Auth0AccessTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

export interface Auth0UserDetailsResponse {
    created_at: string;
    email: string;
    email_verified: boolean;
    identities: [
        {
            connection: string;
            provider: string;
            user_id: string;
            isSocial: boolean;
        },
    ];
    name: string;
    nickname: string;
    picture: string;
    updated_at: string;
    user_id: string;
    last_ip: string;
    last_login: string;
    logins_count: number;
}
