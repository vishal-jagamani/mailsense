import { DraftAttributes, DraftListDTO, SaveDraftRequestBody, SuccessAPIResponse } from '@mailsense/types';
import { axiosClient, DRAFTS_API_ENDPOINTS } from '@shared/api';

export async function saveDraft(payload: SaveDraftRequestBody): Promise<DraftAttributes> {
    const { data } = await axiosClient.post<DraftAttributes>(DRAFTS_API_ENDPOINTS.SAVE, payload);
    return data;
}

export async function getUserDrafts(): Promise<DraftListDTO[]> {
    const { data } = await axiosClient.get<DraftListDTO[]>(DRAFTS_API_ENDPOINTS.BASE);
    return data;
}

export async function getDraftById(draftId: string): Promise<DraftAttributes> {
    const { data } = await axiosClient.get<DraftAttributes>(DRAFTS_API_ENDPOINTS.DETAILS(draftId));
    return data;
}

export async function deleteDraft(draftId: string): Promise<SuccessAPIResponse> {
    const { data } = await axiosClient.delete<SuccessAPIResponse>(DRAFTS_API_ENDPOINTS.DETAILS(draftId));
    return data;
}

export async function sendDraft(draftId: string): Promise<SuccessAPIResponse> {
    const { data } = await axiosClient.post<SuccessAPIResponse>(DRAFTS_API_ENDPOINTS.SEND(draftId));
    return data;
}
