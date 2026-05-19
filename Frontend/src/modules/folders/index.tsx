'use client';

import APILoader from '@/shared/components/apiLoader';
import Loader from '@/shared/components/loader';
import { useAuthStore } from '@/store';
import { EMAILS_PAGE_SIZE, HOME_ROUTES } from '@shared/constants';
import { UseDebounceQuery } from '@shared/hooks/useDebounceQuery';
import { useBreadcrumbStore } from '@shared/store/breadcrumb.store';
import { GetAllFoldersFilters, GetAllFoldersRequestOptions } from '@shared/types/folder.types';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useGetAllFolders } from './services/useFolderApi';

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
    const [getAllFoldersFilters, setGetAllFoldersFilters] = useState<GetAllFoldersFilters | null>(null);

    const currentPage = debouncedSearchValue !== undefined && debouncedSearchValue !== '' ? 1 : page;

    const queryOptions: GetAllFoldersRequestOptions | null = useMemo(() => {
        if (!user?.id) return null;
        return {
            userId: user.id,
            size: pageSize,
            page: currentPage,
            filters: {
                searchText: debouncedSearchValue || undefined,
                accountId: getAllFoldersFilters?.accountId,
                dateRange: getAllFoldersFilters?.dateRange,
            },
        };
    }, [user?.id, pageSize, currentPage, debouncedSearchValue, getAllFoldersFilters]);

    const { data: foldersData, isLoading: foldersLoading, error: foldersError } = useGetAllFolders(queryOptions);

    useEffect(() => {
        useBreadcrumbStore.setState({
            items: [{ title: 'Folders', url: HOME_ROUTES.ALL_FOLDERS }],
        });
    }, []);

    useEffect(() => {
        if (foldersError) {
            toast.error(foldersError.message, { duration: 3000 });
        }
    }, [foldersError]);

    const handlePageSizeChange = (newSize: number) => {
        setPage(1);
        setPageSize(newSize);
    };

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
                page={currentPage}
                total={foldersData?.total || 0}
                onPageChange={(page) => setPage(page)}
                onPageSizeChange={handlePageSizeChange}
            />
        </div>
    );
};

const FoldersPageWrapper = () => (
    <Suspense fallback={<Loader />}>
        <FoldersPage />
    </Suspense>
);

export default FoldersPageWrapper;
