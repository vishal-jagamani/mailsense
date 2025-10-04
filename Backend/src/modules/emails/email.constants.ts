import { EmailListDBFieldMapping } from './email.types.js';

// DB Field Mapping
export const EMAIL_LIST_DB_FIELD_MAPPING: EmailListDBFieldMapping = {
    LIST: {
        projection: {
            _id: 1,
            subject: 1,
            from: 1,
            receivedAt: 1,
            isRead: 1,
            providerMessageId: 1,
            accountId: 1,
        },
    },
};
