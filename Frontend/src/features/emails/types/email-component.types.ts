import {
    AccountAttributes,
    APIResponse,
    ComposeEmailRequestBody,
    EmailAttachment,
    EmailAttributes,
    FolderAttributes,
    SearchOtherContactsResponse,
} from '@mailsense/types';

export interface EmailHeaderProps {
    accountId: string;
    email?: EmailAttributes;
}

export interface EmailBodyPreviewProps {
    html?: string | null;
    plain?: string | null;
}

export interface DeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDelete: () => void;
    title?: string;
    description?: string;
}

export interface ComposeEmailFooterProps {
    accountsData: AccountAttributes[];
    composeEmailBody: ComposeEmailRequestBody;
    setComposeEmailBody: (body: ComposeEmailRequestBody) => void;
    sendEmail: () => Promise<void>;
    handleClose: () => void;
    handleDiscardDraft: () => void;
    isUploadingAttachment: boolean;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export interface ComposeEmailHeaderProps {
    composeEmailBody: ComposeEmailRequestBody;
    setComposeEmailBody: React.Dispatch<React.SetStateAction<ComposeEmailRequestBody>>;
    isToFocused: boolean;
    setIsToFocused: React.Dispatch<React.SetStateAction<boolean>>;
    toEmailSearchText: string;
    setToEmailSearchText: React.Dispatch<React.SetStateAction<string>>;
    searchOtherContactsData: APIResponse<SearchOtherContactsResponse[]> | null;
    debouncedToEmailSearchText: string;
}

export interface SearchToEmailPopupProps {
    data: SearchOtherContactsResponse[];
    setComposeEmailBody: React.Dispatch<React.SetStateAction<ComposeEmailRequestBody>>;
    onSelect?: () => void;
}

export interface RichTextEditorProps {
    content: string;
    onContentChange: (value: string) => void;
    placeholder?: string;
    editable?: boolean;
    className?: string;
}

export interface ThreadViewProps {
    account: AccountAttributes | undefined;
    emails: EmailAttributes[];
}

export interface AttachmentListProps {
    emailId: string;
    attachments: EmailAttachment[];
}

export interface AttachmentPreviewProps {
    previewUrl: string | null;
    closePreview: () => void;
}

export interface AttachmentBadgeProps {
    count?: number;
}

export interface ThreadViewHeaderBarProps {
    emailId: string;
    email: EmailAttributes;
    toggleExpand: (emailId: string) => void;
    isExpanded: boolean;
    accountEmailAddress: string;
}

export interface EmailBodyPreviewProps {
    readonly bodyPlain?: string;
    readonly bodyHtml?: string;
    readonly isExpanded?: boolean;
}

export interface MoveToFolderDropdownProps {
    emailIds: string[];
    selectedEmails?: EmailAttributes[];
    allEmails?: EmailAttributes[];
    accountId?: string;
    folders?: FolderAttributes[];
    currentFolderId?: string;
    onSuccess?: () => void;
    disabled?: boolean;
}

export interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface EmailMenuBarOptionsProps {
    accountId: string;
    emailId: string;
    onManualUnreadOperation?: () => void;
}
