export interface SearchEmailPayload {
    searchText: string;
    userId: string;
}

export interface DeleteEmailPayload {
    emailIds: string[];
    trash: boolean;
}
