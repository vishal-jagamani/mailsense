export interface DatabaseConnectionOptions {
    readonly dbName?: string;
    readonly maxPoolSize?: number;
    readonly minPoolSize?: number;
    readonly serverSelectionTimeoutMS?: number;
    readonly socketTimeoutMS?: number;
}
