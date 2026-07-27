import { ProjectionType } from 'mongoose';
import { AccountDocument } from './account.model.js';

// DB Field Mapping
export interface AccountFetchAccessTokenDBMapping {
    FETCH_ACCESS_TOKEN: { projection: ProjectionType<AccountDocument> };
}
