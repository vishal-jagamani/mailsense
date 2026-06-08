'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { GetAllEmailsFilters, GetEmailsResponse } from '@entities/email';
import { useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import EmailListTable from '@modules/home/components/EmailListTable';
import { useFetchEmails } from '@modules/home/services/useHomeApi';
import EmailListFilter from '@modules/inbox/components/EmailListFilter';
import EmailMenuBarOptions from '@modules/inbox/components/EmailMenuBarOptions';
import APILoader from '@shared/components/apiLoader';
import SearchHeader from '@shared/components/inputs/SearchHeader';
import Loader from '@shared/components/loader';
import PaginationComponent from '@shared/components/table/Pagination';
import { EMAILS_PAGE_SIZE, MESSAGES, UI_CONSTANTS } from '@shared/constants';
import { UseDebounceQuery, useIsMobile } from '@shared/hooks';
import { useAuthStore, useBreadcrumbStore } from '@shared/store';
import { useGetFolderQuery } from '../services/useFolderApi';

interface FolderEmailListProps {
    folderId: string;
}

const FolderEmailList: React.FC<FolderEmailListProps> = ({ folderId }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuthStore();
    const isMobile = useIsMobile();

    const [page, setPage] = useState(() => {
        const pageParam = searchParams.get('page');
        return pageParam ? parseInt(pageParam) : 1;
    });
    const [pageSize, setPageSize] = useState(EMAILS_PAGE_SIZE);
    const [searchValue, setSearchValue] = useState('');
    const [emailsData, setEmailsData] = useState<GetEmailsResponse | null>(null);
    const debouncedSearchValue = UseDebounceQuery({ text: searchValue, delay: 500 });
    const [errorShown, setErrorShown] = useState<boolean>(false);
    const [getAllEmailsFilters, setGetAllEmailsFilters] = useState<GetAllEmailsFilters | null>(null);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

    const { data: folder, isError: isFolderError } = useGetFolderQuery(folderId);
    const { data: emails, mutate: refetchEmails, isPending: isLoadingEmails, isError: isEmailError } = useFetchEmails();
    const { data: accounts, isLoading: accountsLoading, error: accountError } = useGetAccountsQuery(user?.id ?? '');

    const fetchEmailsData = useCallback(() => {
        if (!user || !folder) return;
        const currentPage = debouncedSearchValue !== undefined && debouncedSearchValue !== '' ? 1 : page;
        refetchEmails({
            userId: user.id,
            size: pageSize,
            page: currentPage,
            filters: {
                searchText: debouncedSearchValue || undefined,
                accountId: folder?.accountId ? [folder.accountId] : undefined,
                dateRange: getAllEmailsFilters?.dateRange,
                folders: folder?.providerFolderId ? [folder.providerFolderId] : undefined,
            },
        });
    }, [user, page, pageSize, debouncedSearchValue, refetchEmails, getAllEmailsFilters, folder]);

    useEffect(() => {
        if (debouncedSearchValue !== undefined && debouncedSearchValue !== '') {
            setPage(1);
        }
    }, [debouncedSearchValue]);

    useEffect(() => {
        fetchEmailsData();
    }, [fetchEmailsData]);

    useEffect(() => {
        if (emails) {
            setEmailsData(emails);
            setSelectedEmails([]); // Reset selection when email list changes
        }
    }, [emails]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', page.toString());
        router.replace(`/folders/${folderId}?${params.toString()}`, { scroll: false });
    }, [page, folderId, router]);

    useEffect(() => {
        if (folder) {
            useBreadcrumbStore.setState({
                items: [
                    { title: 'Folders', url: '/folders' },
                    { title: folder.name, url: `/folders/${folderId}` },
                ],
            });
        }
    }, [folder, folderId]);

    useEffect(() => {
        if (isEmailError && !errorShown) {
            toast.error(MESSAGES.EMAIL_LOAD_ERROR, { duration: 3000 });
            setErrorShown(true);
        } else if (accountError && !errorShown) {
            toast.error(MESSAGES.ACCOUNTS_LOAD_ERROR, { duration: 3000 });
            setErrorShown(true);
        } else if (isFolderError && !errorShown) {
            toast.error(MESSAGES.FOLDERS.FOLDER_LOAD_ERROR, { duration: 3000 });
            setErrorShown(true);
        } else if (!isEmailError && !accountError && !isFolderError) {
            setErrorShown(false);
        }
    }, [isEmailError, errorShown, accountError, isFolderError]);

    const handlePageSizeChange = (newSize: number) => {
        setPage(1);
        setPageSize(newSize);
    };

    const handleEmailSelect = useCallback((emailIds: string[]) => {
        setSelectedEmails(emailIds);
    }, []);

    const handleResetSelection = useCallback(() => {
        setSelectedEmails([]);
    }, []);

    const handleResetPage = useCallback(() => {
        setPage(1);
    }, []);

    return (
        <div className="flex items-center justify-center gap-4 px-4 py-2">
            <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                <APILoader show={isLoadingEmails || accountsLoading} />
                {isMobile ? (
                    <div className="flex w-full flex-col items-center gap-2">
                        <div className="w-full">
                            <SearchHeader value={searchValue} onChange={setSearchValue} placeholder={UI_CONSTANTS.PLACEHOLDERS.SEARCH_EMAILS} />
                        </div>
                        <div className="flex w-full justify-between">
                            <EmailListFilter
                                accounts={accounts || []}
                                filter={getAllEmailsFilters}
                                onFilterChange={(value: GetAllEmailsFilters) => setGetAllEmailsFilters(value)}
                            />
                            <EmailMenuBarOptions
                                emailIds={selectedEmails}
                                onResetSelection={handleResetSelection}
                                onResetPage={handleResetPage}
                                onRefetchEmails={fetchEmailsData}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex w-full items-center gap-2">
                        <EmailListFilter
                            accounts={accounts || []}
                            filter={getAllEmailsFilters}
                            onFilterChange={(value: GetAllEmailsFilters) => setGetAllEmailsFilters(value)}
                        />
                        <SearchHeader value={searchValue} onChange={setSearchValue} placeholder={UI_CONSTANTS.PLACEHOLDERS.SEARCH_EMAILS} />
                        <EmailMenuBarOptions
                            emailIds={selectedEmails}
                            onRefetchEmails={fetchEmailsData}
                            onResetSelection={handleResetSelection}
                            onResetPage={handleResetPage}
                        />
                    </div>
                )}
                {/* <div></div> */}
                <div className={`flex w-full flex-col ${isMobile ? 'h-[calc(100vh-220px)]' : 'h-[calc(100vh-150px)]'}`}>
                    <EmailListTable data={emailsData?.data || []} page={page} selectedEmails={selectedEmails} onEmailSelect={handleEmailSelect} />
                </div>
                <PaginationComponent
                    total={emailsData?.total || 0}
                    currentPage={page}
                    onPageChange={setPage}
                    onPageSizeChange={handlePageSizeChange}
                    pageSize={pageSize}
                />
            </div>
        </div>
    );
};

const FolderEmailListWrapper: React.FC<FolderEmailListProps> = (props) => (
    <Suspense fallback={<Loader />}>
        <FolderEmailList {...props} />
    </Suspense>
);

export default FolderEmailListWrapper;
