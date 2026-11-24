'use client';

import { useGetAccountDetailsQuery, useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import { useEmailListState } from '@features/emails/hooks/useEmailListState';
import { useEmailPagination } from '@features/emails/hooks/useEmailPagination';
import { useFetchEmails } from '@features/inbox/api/inbox.queries';
import { MESSAGES } from '@shared/constants';
import { useAuthStore, useBreadcrumbStore } from '@shared/store';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export const useInboxPageData = (accountId?: string) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const user = useAuthStore((state) => state.user);

    const [errorShown, setErrorShown] = useState<boolean>(false);

    const { data: emails, mutate: refetchEmails, isPending: isLoadingEmails, isError: isEmailError } = useFetchEmails();
    const { data: accountData, error: accountDetailsError } = useGetAccountDetailsQuery(accountId || '', { enabled: !!accountId });
    const { data: accountsData } = useGetAccountsQuery(user?.id || '', { enabled: !accountId && !!user?.id });

    const pagination = useEmailPagination();
    const listState = useEmailListState();

    const isSyncingInProgress = accountId
        ? Boolean(accountData?.syncInProgress)
        : Boolean(Array.isArray(accountsData) && accountsData.some((acc) => acc.syncInProgress));

    const fetchEmailsData = useCallback(() => {
        if (!user) return;
        const currentPage = pagination.debouncedSearchValue !== '' ? 1 : pagination.page;
        refetchEmails({
            userId: user.id,
            size: pagination.pageSize,
            page: currentPage,
            filters: {
                accountId: accountId ? [accountId] : pagination.filter?.accountId,
                searchText: pagination.debouncedSearchValue || undefined,
                folders: pagination.filter?.folders,
                dateRange: pagination.filter?.dateRange,
                unread: pagination.filter?.unread,
                aiCategory: pagination.filter?.aiCategory,
                aiPriority: pagination.filter?.aiPriority,
            },
        });
    }, [user, pagination.page, pagination.pageSize, pagination.debouncedSearchValue, pagination.filter, accountId, refetchEmails]);

    useEffect(() => {
        if (emails) listState.setEmailsData(emails);
    }, [emails]);

    useEffect(() => {
        fetchEmailsData();
    }, [fetchEmailsData]);

    useEffect(() => {
        if (!isSyncingInProgress) return;
        const intervalId = setInterval(fetchEmailsData, 10000);
        return () => clearInterval(intervalId);
    }, [isSyncingInProgress, fetchEmailsData]);

    useEffect(() => {
        if (pagination.debouncedSearchValue !== '') pagination.setPage(1);
    }, [pagination.debouncedSearchValue]);

    useEffect(() => {
        const urlPage = searchParams.get('page');
        if (urlPage !== pagination.page.toString()) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', pagination.page.toString());
            const basePath = accountId ? `/inbox/${accountId}` : '/inbox';
            router.replace(`${basePath}?${params.toString()}`);
        }
    }, [pagination.page, accountId, router, searchParams]);

    useEffect(() => {
        if (accountId && accountData) {
            useBreadcrumbStore.setState({
                items: [
                    { title: 'Inbox', url: '/inbox' },
                    { title: accountData.emailAddress || '', url: `/inbox/${accountData._id}` },
                ],
            });
        } else if (!accountId) {
            useBreadcrumbStore.setState({ items: [{ title: 'Inbox', url: '/inbox' }] });
        }
    }, [accountId, accountData]);

    const activeAccountError = accountId ? accountDetailsError : null;
    useEffect(() => {
        if (isEmailError && !errorShown) {
            toast.error(MESSAGES.EMAILS.EMAIL_LOAD_ERROR, { duration: 3000 });
            setErrorShown(true);
        } else if (activeAccountError && !errorShown) {
            toast.error(MESSAGES.ACCOUNTS.ACCOUNTS_LOAD_ERROR, { duration: 3000 });
            setErrorShown(true);
        } else if (!isEmailError && !activeAccountError) {
            setErrorShown(false);
        }
    }, [isEmailError, errorShown, activeAccountError]);

    return {
        states: { listState, isSyncingInProgress },
        emails: { loading: isLoadingEmails, error: isEmailError },
        pagination: { data: pagination },
        actions: { fetchEmailsData },
    };
};
