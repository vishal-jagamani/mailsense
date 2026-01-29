import { create } from 'zustand';

interface BreadcrumbStore {
    items: { title: string; url: string }[];
    setItems: (items: { title: string; url: string }[]) => void;
}

export const useBreadcrumbStore = create<BreadcrumbStore>((set) => ({
    items: [],
    setItems: (items) => set({ items }),
}));
