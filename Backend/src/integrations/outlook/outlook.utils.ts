import { OUTLOOK_SECRETS } from '@config';
import { OAUTH_ACCESS_REDIRECT_URI, OAUTH_SCOPES } from '@constants';
import { FOLDER_KIND, FOLDER_ROLE, OutlookMessageObjectFull } from '@mailsense/types';
import { FolderInput } from '@modules/folders/folder.model.js';
import { OutlookFolderObject } from './outlook.types.js';

// Build outlook oauth access consent url
export const buildOutlookOAuthConsentURL = async () => {
    const params = new URLSearchParams({
        client_id: OUTLOOK_SECRETS.clientId,
        redirect_uri: OUTLOOK_SECRETS.redirectUri,
        response_type: 'code',
        response_mode: 'query',
        scope: OAUTH_SCOPES.OUTLOOK,
        prompt: 'select_account',
    });
    return `${OAUTH_ACCESS_REDIRECT_URI.OUTLOOK}?${params.toString()}`;
};

const getOutlookFolderRole = (displayName: string): FOLDER_ROLE => {
    const displayNameLower = displayName.toLowerCase();

    if (displayNameLower === 'inbox') return FOLDER_ROLE.INBOX;
    if (displayNameLower === 'sent items' || displayNameLower === 'sentitems') return FOLDER_ROLE.SENT;
    if (displayNameLower === 'drafts') return FOLDER_ROLE.DRAFTS;
    if (displayNameLower === 'deleted items' || displayNameLower === 'deleteditems') return FOLDER_ROLE.TRASH;
    if (displayNameLower === 'junk email' || displayNameLower === 'spam') return FOLDER_ROLE.SPAM;
    if (displayNameLower === 'archive') return FOLDER_ROLE.ARCHIVE;

    return FOLDER_ROLE.OTHER;
};

const isOutlookSystemFolder = (displayName: string): boolean => {
    const displayNameLower = displayName.toLowerCase();
    return (
        displayNameLower === 'inbox' ||
        displayNameLower === 'sent items' ||
        displayNameLower === 'sentitems' ||
        displayNameLower === 'drafts' ||
        displayNameLower === 'deleted items' ||
        displayNameLower === 'deleteditems' ||
        displayNameLower === 'junk email' ||
        displayNameLower === 'spam' ||
        displayNameLower === 'archive'
    );
};

export const parseOutlookFolderObject = (accountId: string, userId: string, folder: OutlookFolderObject): Partial<FolderInput> => {
    return {
        accountId: accountId,
        name: folder.displayName,
        providerFolderId: folder.id,
        userId: userId,
        parentProviderFolderId: folder.parentFolderId || '',
        normalizedName: folder.displayName.toLowerCase().trim(),
        role: getOutlookFolderRole(folder.displayName),
        kind: isOutlookSystemFolder(folder.displayName) ? FOLDER_KIND.SYSTEM : FOLDER_KIND.CUSTOM,
        totalEmails: folder.totalItemCount || 0,
        totalUnreadEmails: folder.unreadItemCount || 0,
        totalThreads: folder.totalItemCount || 0,
        totalUnreadThreads: folder.unreadItemCount || 0,
        totalChildFolders: folder.childFolderCount || 0,
        isHidden: folder.isHidden || false,
        color: {
            text: '',
            background: '',
        },
        lastSyncedAt: new Date(),
        providerMeta: {
            isHidden: folder.isHidden,
            childFolderCount: folder.childFolderCount,
        },
    };
};

export const buildOutlookMessagePayload = (
    to: string[],
    subject: string,
    body: string,
    contentType: 'Text' | 'HTML' = 'Text',
): Partial<OutlookMessageObjectFull> => {
    return {
        toRecipients: to.map((email) => ({ emailAddress: { address: email, name: '' } })),
        subject,
        body: {
            contentType,
            content: body,
        },
    };
};
