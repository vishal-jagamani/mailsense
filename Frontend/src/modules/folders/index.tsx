'use client';

import { EMAILS_PAGE_SIZE, HOME_ROUTES } from '@/shared/constants';
import { UseDebounceQuery } from '@/shared/hooks/useDebounceQuery';
import { useBreadcrumbStore } from '@/shared/store/breadcrumb.store';
import { GetALlFolderResponse, GetAllFoldersFilters } from '@/shared/types/folder.types';
import { useAuthStore } from '@/store';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useGetAllFolders } from './services/useFolderApi';
import APILoader from '@/shared/components/apiLoader';

const FolderHeader = dynamic(() => import('./components/header'));
const FolderBody = dynamic(() => import('./components/body'));

const FoldersPage: React.FC = () => {
    const { user } = useAuthStore();
    const searchParams = useSearchParams();

    const [page, setPage] = useState(() => {
        const pageParam = searchParams.get('page');
        return pageParam ? parseInt(pageParam) : 1;
    });
    const [pageSize, setPageSize] = useState(EMAILS_PAGE_SIZE);
    const [searchText, setSearchText] = useState<string>('');
    const debouncedSearchValue = UseDebounceQuery({ text: searchText, delay: 500 });
    const [foldersData, setFoldersData] = useState<GetALlFolderResponse | null>(null);
    const [getAllFoldersFilters, setGetAllFoldersFilters] = useState<GetAllFoldersFilters | null>(null);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

    const { data: folders, mutate: refetchFolders, isPending: foldersLoading, error: foldersError } = useGetAllFolders();

    const fetchEmailsData = useCallback(async () => {
        if (!user) return;
        const currentPage = debouncedSearchValue !== undefined && debouncedSearchValue !== '' ? 1 : page;
        refetchFolders({
            userId: user.id,
            size: pageSize,
            page: currentPage,
            filters: {
                searchText: debouncedSearchValue || undefined,
                accountId: getAllFoldersFilters?.accountId,
                dateRange: getAllFoldersFilters?.dateRange,
            },
        });
    }, [user, page, pageSize, debouncedSearchValue, refetchFolders, getAllFoldersFilters]);

    useEffect(() => {
        if (debouncedSearchValue !== undefined && debouncedSearchValue !== '') {
            setPage(1);
        }
    }, [debouncedSearchValue]);

    useEffect(() => {
        fetchEmailsData();
    }, [fetchEmailsData]);

    useEffect(() => {
        useBreadcrumbStore.setState({
            items: [{ title: 'Folders', url: HOME_ROUTES.ALL_FOLDERS }],
        });
    }, []);

    useEffect(() => {
        if (folders) {
            setFoldersData(folders);
            setSelectedEmails([]); // Reset selection when email list changes
        }
    }, [folders]);

    useEffect(() => {
        if (foldersError) {
            toast.error(foldersError.message, { duration: 3000 });
        }
    }, [foldersError]);

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

    return (
        <div className="flex flex-col gap-2">
            <APILoader show={foldersLoading} />
            <FolderHeader
                filter={null}
                onFilterChange={(filter) => setGetAllFoldersFilters(filter)}
                searchText={searchText}
                setSearchText={setSearchText}
            />
            <FolderBody
                tableData={foldersData?.data || []}
                size={pageSize}
                page={page}
                total={foldersData?.total || 0}
                onPageChange={(page) => setPage(page)}
                onPageSizeChange={handlePageSizeChange}
            />
        </div>
    );
};

export default FoldersPage;
