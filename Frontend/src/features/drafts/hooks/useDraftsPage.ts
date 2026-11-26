import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { EMAILS_PAGE_SIZE, HOME_ROUTES } from '@shared/constants';
import { UseDebounceQuery } from '@shared/hooks';
import { useBreadcrumbStore, useComposeEmailPopupStore } from '@shared/store';
import { useDeleteDraftMutation } from '../api/draft.mutations';
import { useGetUserDraftsQuery } from '../api/draft.queries';
import { UseDraftsPageResult } from '../types';

export const useDraftsPage = (): UseDraftsPageResult => {
    const { data: userDraftsData, isLoading: userDraftsLoading, isError: userDraftsError, refetch } = useGetUserDraftsQuery();
    const { mutate: deleteDraft, mutateAsync: deleteDraftAsync, isPending: isDeleting } = useDeleteDraftMutation();
    const { openWithDraft } = useComposeEmailPopupStore();

    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(EMAILS_PAGE_SIZE);
    const [searchValue, setSearchValue] = useState<string>('');
    const [selectedDrafts, setSelectedDrafts] = useState<string[]>([]);
    const debouncedSearchValue = UseDebounceQuery({ text: searchValue, delay: 300 });

    useEffect(() => {
        useBreadcrumbStore.setState({ items: [{ title: 'Drafts', url: HOME_ROUTES.DRAFTS }] });
    }, []);

    // Filter drafts based on search query
    const filteredDrafts = useMemo(() => {
        if (!userDraftsData) return [];
        const q = (debouncedSearchValue || '').trim().toLowerCase();
        if (!q) return userDraftsData;

        return userDraftsData.filter((draft) => {
            const matchesSubject = draft.subject?.toLowerCase().includes(q);
            const matchesRecipient = draft.to?.some((recipient) => recipient.toLowerCase().includes(q));
            const matchesSnippet = draft.snippet?.toLowerCase().includes(q);
            return matchesSubject || matchesRecipient || matchesSnippet;
        });
    }, [userDraftsData, debouncedSearchValue]);

    // Paginate filtered drafts
    const paginatedDrafts = useMemo(() => {
        const startIndex = (page - 1) * pageSize;
        return filteredDrafts.slice(startIndex, startIndex + pageSize);
    }, [filteredDrafts, page, pageSize]);

    const handleDraftSelect = (draftIds: string[]) => {
        setSelectedDrafts(draftIds);
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setPage(1);
    };

    const handleResetSelection = () => {
        setSelectedDrafts([]);
    };

    const handleDeleteDraft = async (draftId: string): Promise<void> => {
        deleteDraft(draftId, {
            onSuccess: (res) => {
                if (res?.status) {
                    toast.success('Draft deleted successfully');
                    setSelectedDrafts((prev) => prev.filter((id) => id !== draftId));
                    refetch();
                    return;
                }
                toast.error('Failed to delete draft');
            },
        });
    };

    const handleBulkDelete = async (): Promise<void> => {
        if (selectedDrafts.length === 0) return;

        const results = await Promise.allSettled(selectedDrafts.map((draftId) => deleteDraftAsync(draftId)));
        const failedCount = results.filter((r) => r.status === 'rejected').length;

        if (failedCount === 0) {
            toast.success(`${selectedDrafts.length} drafts deleted successfully`);
            setSelectedDrafts([]);
        } else {
            toast.error(`Failed to delete ${failedCount} of ${selectedDrafts.length} selected drafts`);
        }
        refetch();
    };

    const handleOpenDraft = (draftId: string) => {
        openWithDraft(draftId);
    };

    return {
        drafts: { data: paginatedDrafts, total: filteredDrafts.length, isLoading: userDraftsLoading, isError: userDraftsError, refetch },
        actions: {
            handleDraftSelect,
            handlePageSizeChange,
            handleResetSelection,
            handleDeleteDraft,
            handleBulkDelete,
            handleOpenDraft,
        },
        states: { selectedDrafts, page, pageSize, searchValue, isDeleting },
        setters: { setPage, setSearchValue },
    };
};
