import { ThemeState } from '@shared/types';
import { create } from 'zustand';

export const useThemeStore = create<ThemeState>((set) => ({
    theme: 'system',
    setTheme: (theme) => set({ theme }),
}));
