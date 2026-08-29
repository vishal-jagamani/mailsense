import { create } from 'zustand';

export interface ComposeEmailPopupStore {
    isOpen: boolean;
    activeDraftId?: string;
    openCompose: () => void;
    openWithDraft: (draftId: string) => void;
    closeCompose: () => void;
    toggleCompose: (isOpen: boolean) => void;
}

export const useComposeEmailPopupStore = create<ComposeEmailPopupStore>((set) => ({
    isOpen: false,
    activeDraftId: undefined,
    openCompose: () => set({ isOpen: true, activeDraftId: undefined }),
    openWithDraft: (draftId: string) => set({ isOpen: true, activeDraftId: draftId }),
    closeCompose: () => set({ isOpen: false, activeDraftId: undefined }),
    toggleCompose: (isOpen: boolean) => set({ isOpen, activeDraftId: undefined }),
}));
