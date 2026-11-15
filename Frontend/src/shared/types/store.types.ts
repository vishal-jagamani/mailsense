import { User } from '@mailsense/types';

export interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;
    user: User | null;
    setIsAuthenticated: (isAuthenticated: boolean) => void;
    setUser: (user: User | null) => void;
    logout: () => void;
}

export interface ThemeState {
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export interface BreadcrumbItem {
    title: string;
    url: string;
}

export interface BreadcrumbStore {
    items: BreadcrumbItem[];
    setItems: (items: BreadcrumbItem[]) => void;
}

export interface ComposeEmailPopupStore {
    isOpen: boolean;
    activeDraftId?: string;
    openCompose: () => void;
    openWithDraft: (draftId: string) => void;
    closeCompose: () => void;
    toggleCompose: (isOpen: boolean) => void;
}
