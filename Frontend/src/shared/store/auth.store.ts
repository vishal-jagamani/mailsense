import { AuthState } from '@shared/types';
import { create } from 'zustand';

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    isLoading: false,
    setIsLoading: (isLoading) => set({ isLoading }),
    user: null,
    setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
    setUser: (user) => set({ user }),
    logout: () => set({ isAuthenticated: false, user: null }),
}));
