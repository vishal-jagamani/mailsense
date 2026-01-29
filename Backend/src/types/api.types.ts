export interface APIResponse<T> {
    status: boolean;
    message: string;
    data: T;
}

export interface PaginatedDataResponse<T> {
    data: T;
    size: number;
    page: number;
    total: number;
}

export interface SuccessAPIResponse {
    status: boolean;
    message: string;
}

export interface UpdateAPIResponse {
    status: boolean;
    message: string;
}
