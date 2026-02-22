export interface EmailListDTO {
    _id: string;
    subject?: string;
    from?: string;
    receivedAt?: Date;
    isRead?: boolean;
    body?: string;
    bodyHtml?: string;
    bodyPlain?: string;
}

export interface GetEmailsResponse {
    data: EmailListDTO[];
    size: number;
    page: number;
    total: number;
}
