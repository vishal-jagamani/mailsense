import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Filter, GetAllFoldersRequestOptions } from '@mailsense/types';
import { EMAILS_PAGE_SIZE, HOME_ROUTES } from '@shared/constants';
import { UseDebounceQuery } from '@shared/hooks';
import { useAuthStore, useBreadcrumbStore } from '@shared/store';
import { toast } from 'sonner';
import { useGetAllFolders } from '../api/folder.queries';

export const useFoldersPage = () => {
    const { user } = useAuthStore();
    const searchParams = useSearchParams();

    const [page, setPage] = useState(() => {
        const pageParam = searchParams.get('page');
        return pageParam ? parseInt(pageParam) : 1;
    });
    const [pageSize, setPageSize] = useState(EMAILS_PAGE_SIZE);
    const [searchText, setSearchText] = useState<string>('');
    const debouncedSearchValue = UseDebounceQuery({ text: searchText, delay: 500 });
    const [filter, setFilter] = useState<Filter | null>(null);

    const currentPage = debouncedSearchValue !== undefined && debouncedSearchValue !== '' ? 1 : page;

    const queryOptions: GetAllFoldersRequestOptions | null = useMemo(() => {
        if (!user?.id) return null;
        return {
            userId: user.id,
            size: pageSize,
            page: currentPage,
            filters: {
                searchText: debouncedSearchValue || undefined,
                accountId: filter?.accountId,
                dateRange: filter?.dateRange,
            },
        };
    }, [user?.id, pageSize, currentPage, debouncedSearchValue, filter]);

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

    return {
        folders: { data: foldersData, isLoading: foldersLoading },
        states: { pageSize, searchText, currentPage },
        setters: { setPage, setFilter, setSearchText },
        actions: { handlePageSizeChange },
    };
};
