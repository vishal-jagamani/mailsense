import { DraftAttributes, DraftListDTO } from '@mailsense/types';
import { DRAFT_QUERY_KEYS } from '@shared/api';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getDraftById, getUserDrafts } from './draft.api';

export const useGetUserDraftsQuery = (): UseQueryResult<DraftListDTO[], Error> => {
    return useQuery<DraftListDTO[], Error>({
        queryKey: DRAFT_QUERY_KEYS.list(),
        queryFn: async () => getUserDrafts(),
    });
};

export const useGetDraftByIdQuery = (draftId: string, enabled: boolean = true): UseQueryResult<DraftAttributes, Error> => {
    return useQuery<DraftAttributes, Error>({
        queryKey: DRAFT_QUERY_KEYS.detail(draftId),
        queryFn: async () => getDraftById(draftId),
        enabled: Boolean(draftId) && enabled,
    });
};
