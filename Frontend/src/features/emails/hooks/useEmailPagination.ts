'use client';

import { Filter } from '@mailsense/types';
import { EMAILS_PAGE_SIZE } from '@shared/constants';
import { UseDebounceQuery } from '@shared/hooks';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { UseEmailPaginationOptions, UseEmailPaginationReturn } from '../types/email-ui.types';

export function useEmailPagination(options?: UseEmailPaginationOptions): UseEmailPaginationReturn {
    const searchParams = useSearchParams();

    const [page, setPage] = useState<number>(() => {
        const pageParam = searchParams.get('page');
        return pageParam ? parseInt(pageParam, 10) : (options?.initialPage ?? 1);
    });

    const [pageSize, setPageSize] = useState<number>(options?.initialPageSize ?? EMAILS_PAGE_SIZE);
    const [searchValue, setSearchValue] = useState<string>('');
    const [filter, setFilter] = useState<Filter | null>(options?.initialFilter ?? null);

    const debouncedSearchValue = UseDebounceQuery({ text: searchValue, delay: 500 });

    const handlePageSizeChange = (newSize: number): void => {
        setPageSize(newSize);
        setPage(1);
    };

    const handleResetPage = (): void => {
        setPage(1);
    };

    return {
        page,
        pageSize,
        searchValue,
        debouncedSearchValue,
        filter,
        setPage,
        setPageSize,
        setSearchValue,
        setFilter,
        handlePageSizeChange,
        handleResetPage,
    };
}
