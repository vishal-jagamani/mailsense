import { AccountAttributes, AccountProviders } from '@/shared/types/account.types';
import { axiosClient } from '@shared/config/axios';

export async function getAccountProvider(): Promise<AccountProviders[]> {
    const { data } = await axiosClient.get<AccountProviders[]>(`/accounts/providers/list`);
    return data;
}

export async function getAccountDetails(accountId: string): Promise<AccountAttributes> {
    const { data } = await axiosClient.get<AccountAttributes>(`/accounts/${accountId}`);
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

export async function syncAccount(accountId: string) {
    const { data } = await axiosClient.get(`/accounts/sync/${accountId}`);
    return data;
}

export async function removeAccount(accountId: string) {
    const { data } = await axiosClient.delete(`/accounts/${accountId}`);
    return data;
}
