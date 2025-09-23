import { axiosClient } from '@shared/config/axios';

export async function getAccountProvider() {
    const { data } = await axiosClient.get(`/accounts/providers`);
    return data;
}

export async function connectAccount(provider: string) {
    const { data } = await axiosClient.get(`/accounts/connect/${provider}`);
    return data;
}
