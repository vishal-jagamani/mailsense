import { ProjectionType, SortOrder } from 'mongoose';
import { EmailDocument } from './email.model.js';

// DB Field Mapping
export interface EmailListDBFieldMapping {
    LIST: { projection: ProjectionType<EmailDocument> };
    SORT: { sort: Record<string, SortOrder> };
}
