import { AccountAttributes, ComposeEmailRequestBody, EmailAttributes, UploadAttachmentResponse } from '@mailsense/types';
import React from 'react';

export interface UseComposeEmailDraftActions {
    activeDraftId?: string;
    isOpen: boolean;
    closeCompose: () => void;
    composeEmailBody: ComposeEmailRequestBody;
    setComposeEmailBody: React.Dispatch<React.SetStateAction<ComposeEmailRequestBody>>;
    setStagedAttachments: React.Dispatch<React.SetStateAction<UploadAttachmentResponse['attachment'][]>>;
    setToEmailSearchText: React.Dispatch<React.SetStateAction<string>>;
}

export interface UseComposeEmailActionsParams {
    accounts: AccountAttributes[] | undefined;
    stagedAttachments: UploadAttachmentResponse['attachment'][];
    draftId: string | undefined;
    activeDraftId: string | undefined;
    composeEmailBody: ComposeEmailRequestBody;
    handleClose: () => void;
    setComposeEmailBody: React.Dispatch<React.SetStateAction<ComposeEmailRequestBody>>;
}

export interface UseComposeEmailAttachmentsParams {
    composeEmailBody: ComposeEmailRequestBody;
    setComposeEmailBody: React.Dispatch<React.SetStateAction<ComposeEmailRequestBody>>;
    accounts: AccountAttributes[] | undefined;
    setStagedAttachments: React.Dispatch<React.SetStateAction<UploadAttachmentResponse['attachment'][]>>;
    setIsUploadingAttachment: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface UseEvaluateKeyPressParams {
    event: KeyboardEvent;
    emails: EmailAttributes[];
    selectedIndex: number;
    selectedEmails: string[];
    currentEmail: EmailAttributes;
    onSelectIndex: (index: number) => void;
    onOpenEmail: (email: EmailAttributes) => void;
    onStarEmail?: (email?: EmailAttributes) => void;
    onMarkUnread?: (email?: EmailAttributes) => void;
    onArchiveEmail?: (email?: EmailAttributes) => void;
    onDeleteEmail?: (email?: EmailAttributes) => void;
    onOpenCompose?: () => void;
    onOpenShortcutsModal?: () => void;
}

export type EvaluateKeyPressParams = UseEvaluateKeyPressParams;
