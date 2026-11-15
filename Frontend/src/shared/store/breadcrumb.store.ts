import { BreadcrumbStore } from '@shared/types';
import { create } from 'zustand';

export const useBreadcrumbStore = create<BreadcrumbStore>((set) => ({
    items: [],
    setItems: (items) => set({ items }),
}));
