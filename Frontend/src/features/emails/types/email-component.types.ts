import { EmailAttributes, FolderAttributes } from '@mailsense/types';

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
