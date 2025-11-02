export interface OutlookUserProfile {
    id: string;
    displayName: string;
    givenName: string;
    surname: string;
    mail: string;
}

export interface OutlookMessage {
    id: string;
    subject: string;
    sender: {
        emailAddress: {
            name: string;
            address: string;
        };
    };
}
