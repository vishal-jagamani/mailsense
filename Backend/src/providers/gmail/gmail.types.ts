export interface GmailUserProfile {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    email: string;
    email_verified: boolean;
    locale: string;
}

export interface GmailMessages {
    messages: { id: string; threadId: string }[];
    nextPageToken: string;
    resultSizeEstimate: number;
}

type GmailMessageHeaderFull = {
    name: string;
    value: string;
};

type GmailMessagePartsFull = {
    partId: string;
    mimeType: string;
    filename: string;
    headers: GmailMessageHeaderFull[];
    body: { size: number; data: string };
};

export interface GmailMessageObjectFull {
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    payload: {
        partId: string;
        mimeType: string;
        filename: string;
        headers: GmailMessageHeaderFull[];
        body: { size: number; data?: string };
        parts: GmailMessagePartsFull[];
    };
    sizeEstimate: number;
    historyId: string;
    internalDate: string;
}
