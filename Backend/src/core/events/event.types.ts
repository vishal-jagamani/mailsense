import { EmailInput } from '@modules/emails/email.model.js';

export enum SystemEvent {
    SYNC_COMPLETED = 'sync:completed',
    EMAIL_CREATED = 'email:created',
}

export interface SyncCompletedPayload {
    accountId: string;
    addedEmailsCount: number;
    deletedEmailsCount: number;
    startedAt: number;
    completedAt: number;
}

export interface EmailCreatedPayload {
    accountId: string;
    email: EmailInput | Partial<EmailInput>;
}

export interface SystemEventPayloads {
    [SystemEvent.SYNC_COMPLETED]: SyncCompletedPayload;
    [SystemEvent.EMAIL_CREATED]: EmailCreatedPayload;
}
