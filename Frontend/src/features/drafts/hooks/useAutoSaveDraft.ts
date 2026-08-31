import { useEffect, useRef, useState } from 'react';
import { useSaveDraftMutation } from '../api/draft.mutations';
import { UseAutoSaveDraftParams } from '../types';

export const useAutoSaveDraft = ({ composeBody, isOpen, activeDraftId, onDraftSaved }: UseAutoSaveDraftParams) => {
    const [draftId, setDraftId] = useState<string | undefined>(activeDraftId);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const { mutate: saveDraft, isPending: isSaving, data: saveDraftData } = useSaveDraftMutation();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setDraftId(activeDraftId);
    }, [activeDraftId]);

    useEffect(() => {
        if (!isOpen) return;

        // Skip saving if content is completely empty
        const hasContent = Boolean(
            composeBody.accountId && (composeBody.subject?.trim() || composeBody.body?.trim() || (composeBody.to && composeBody.to.length > 0)),
        );

        if (!hasContent) return;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            saveDraft({
                draftId,
                accountId: composeBody.accountId,
                to: composeBody.to || [],
                subject: composeBody.subject || '',
                body: composeBody.body || '',
            });
        }, 3000);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [composeBody, isOpen, draftId, saveDraft, onDraftSaved]);

    useEffect(() => {
        if (saveDraftData) {
            setDraftId(saveDraftData._id);
            setLastSavedAt(new Date(saveDraftData.lastSavedAt));
            if (onDraftSaved) {
                onDraftSaved(saveDraftData._id);
            }
        }
    }, [saveDraftData]);

    return { draftId, isSaving, lastSavedAt };
};
