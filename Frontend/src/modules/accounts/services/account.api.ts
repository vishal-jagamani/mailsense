import { AccountAttributes, AccountProviders } from '@/shared/types/account.types';
import { axiosClient } from '@shared/config/axios';

export async function getAccountProvider() {
    const { data } = await axiosClient.get<AccountProviders[]>(`/accounts/providers`);
    return data;
}

export async function getAccounts(userId: string) {
    const { data } = await axiosClient.get<AccountAttributes[]>(`/accounts/list/${userId}`);
    return data;
}

export async function connectAccount(provider: string) {
    const { data } = await axiosClient.get(`/accounts/connect/${provider}`);
    return data;
}
