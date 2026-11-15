import { EmailAttributes, PaginatedDataResponse } from '@mailsense/types';

export interface EmailPageProps {
    account: string;
    email: string;
}

export interface StarEmailMutationContext {
    previousEmails: PaginatedDataResponse<EmailAttributes> | undefined;
}

export interface UnreadEmailMutationContext {
    previousEmails: PaginatedDataResponse<EmailAttributes> | undefined;
}

export interface ArchiveEmailMutationParams {
    emailIds: string[];
    archive: boolean;
}

export interface ArchiveEmailMutationContext {
    previousEmails: PaginatedDataResponse<EmailAttributes> | undefined;
}

export interface MoveEmailsMutationContext {
    previousEmails: PaginatedDataResponse<EmailAttributes> | undefined;
}
