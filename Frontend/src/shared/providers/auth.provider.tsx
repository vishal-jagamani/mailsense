'use client';

import { useUser } from '@auth0/nextjs-auth0';
import { useAuthStore } from '../store';
import { useEffect } from 'react';

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useUser();
    const { setUser, setIsAuthenticated, setIsLoading } = useAuthStore();

    useEffect(() => {
        setIsLoading(isLoading);

        if (!isLoading && user) {
            setIsAuthenticated(true);
            setUser({ id: user.sub, name: user.name ?? '', email: user.email ?? '' });
        } else if (!isLoading && !user) {
            setIsAuthenticated(false);
            setUser(null);
        }
    }, [isLoading, user, setUser, setIsAuthenticated, setIsLoading]);

    return <>{children}</>;
};

export default AuthProvider;
