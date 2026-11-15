import { FolderAttributes } from '@mailsense/types';
import { ProjectionType, SortOrder } from 'mongoose';

export interface FolderListDBFieldMapping {
    LIST: { projection: ProjectionType<FolderAttributes> };
    SORT: { sort: Record<string, SortOrder> };
}
