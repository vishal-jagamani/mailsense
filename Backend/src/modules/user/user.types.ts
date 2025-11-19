export interface UserDetailsObject {
    created_at: string;
    email: string;
    email_verified: boolean;
    identities: {
        connection: string;
        provider: string;
        user_id: string;
        isSocial: boolean;
    }[];
    name: string;
    nickname: string;
    picture: string;
    updated_at: string;
    user_id: string;
    user_metadata: {
        email: string;
        email_verified: boolean;
        name: string;
        nickname: string;
        picture: string;
        user_metadata: {
            email: string;
            email_verified: boolean;
            name: string;
            nickname: string;
            picture: string;
            user_metadata: {
                phone_number: string;
            };
            phone_number: string;
        };
    };
    last_ip: string;
    last_login: string;
    logins_count: number;
}

export interface UpdatePasswordResponseObject {
    message: string;
}
