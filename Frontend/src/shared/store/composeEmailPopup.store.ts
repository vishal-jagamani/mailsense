import { create } from 'zustand';

interface ComposeEmailPopupStore {
    isOpen: boolean;
    openCompose: () => void;
    closeCompose: () => void;
    toggleCompose: (isOpen: boolean) => void;
}

export const useComposeEmailPopupStore = create<ComposeEmailPopupStore>((set) => ({
    isOpen: false,
    openCompose: () => set({ isOpen: true }),
    closeCompose: () => set({ isOpen: false }),
    toggleCompose: (isOpen: boolean) => set({ isOpen }),
}));
