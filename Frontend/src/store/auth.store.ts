import { create } from 'zustand';
import { User } from '../shared/types';

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;
    user: User | null;
    setIsAuthenticated: (isAuthenticated: boolean) => void;
    setUser: (user: User | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    isLoading: false,
    setIsLoading: (isLoading) => set({ isLoading }),
    user: null,
    setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
    setUser: (user) => set({ user }),
    logout: () => set({ isAuthenticated: false, user: null }),
}));
