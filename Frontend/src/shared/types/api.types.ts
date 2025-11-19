export interface APIResponse<T> {
    status: boolean;
    message: string;
    data: T;
}

export interface UpdateAPIResponse {
    status: boolean;
    message: string;
}
