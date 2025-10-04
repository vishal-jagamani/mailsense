import { ProjectionType } from 'mongoose';
import { EmailDocument } from './email.model.js';

// DB Field Mapping
export interface EmailListDBFieldMapping {
    LIST: { projection: ProjectionType<EmailDocument> };
}
