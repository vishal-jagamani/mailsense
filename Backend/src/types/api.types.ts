export interface APIResponse<T> {
    status: boolean;
    message: string;
    data: T;
}

export interface SuccessAPIResponse {
    status: boolean;
    message: string;
}

export interface UpdateAPIResponse {
    status: boolean;
    message: string;
}
