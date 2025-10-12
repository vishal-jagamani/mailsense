import { AccountFetchAccessTokenDBMapping } from './account.types.js';

// DB Field Mapping
export const ACCOUNT_FETCH_ACCESS_TOKEN_DB_FIELD_MAPPING: AccountFetchAccessTokenDBMapping = {
    FETCH_ACCESS_TOKEN: {
        projection: {
            _id: 1,
            accessToken: 1,
            accessTokenExpiry: 1,
        },
    },
};
