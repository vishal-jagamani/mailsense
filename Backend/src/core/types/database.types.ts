export interface DatabaseConnectionOptions {
    readonly maxPoolSize?: number;
    readonly minPoolSize?: number;
    readonly serverSelectionTimeoutMS?: number;
    readonly socketTimeoutMS?: number;
}

