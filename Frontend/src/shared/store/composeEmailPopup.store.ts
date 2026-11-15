import { ComposeEmailPopupStore } from '@shared/types';
import { create } from 'zustand';

export const useComposeEmailPopupStore = create<ComposeEmailPopupStore>((set) => ({
    isOpen: false,
    activeDraftId: undefined,
    openCompose: () => set({ isOpen: true, activeDraftId: undefined }),
    openWithDraft: (draftId: string) => set({ isOpen: true, activeDraftId: draftId }),
    closeCompose: () => set({ isOpen: false, activeDraftId: undefined }),
    toggleCompose: (isOpen: boolean) => set({ isOpen, activeDraftId: undefined }),
}));
