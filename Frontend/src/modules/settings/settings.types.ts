export interface ProfileSettingsDataObject {
    nickname: string;
    name: string;
    picture: string;
    email: string;
    email_verified: boolean;
    sub: string;
    user_metadata: {
        phone_number: string;
    };
}

export interface UpdateUserProfileSettingsResponse {
    status: boolean;
    message: string;
    data: ProfileSettingsDataObject;
}
