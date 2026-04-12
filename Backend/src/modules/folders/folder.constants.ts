import { FolderListDBFieldMapping } from './folder.types.js';

export const FOLDER_LIST_DB_FIELD_MAPPING: FolderListDBFieldMapping = {
    LIST: {
        projection: {
            _id: 1,
            accountId: 1,
            providerFolderId: 1,
            name: 1,
            normalizedName: 1,
            role: 1,
            kind: 1,
            totalEmails: 1,
            totalUnreadEmails: 1,
            totalThreads: 1,
            totalUnreadThreads: 1,
            totalChildFolders: 1,
            isHidden: 1,
            color: 1,
            lastSyncedAt: 1,
            providerMeta: 1,
        },
    },
    SORT: {
        sort: {
            updatedAt: -1,
        },
    },
};
