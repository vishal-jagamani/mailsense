'use client';

import { useUser } from '@auth0/nextjs-auth0';
import { frontendMonitoring } from '@shared/monitoring';
import { useEffect } from 'react';
import { useAuthStore } from '../store';

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useUser();
    const { setUser, setIsAuthenticated, setIsLoading } = useAuthStore();

    useEffect(() => {
        setIsLoading(isLoading);

        if (!isLoading && user) {
            setIsAuthenticated(true);
            setUser({ id: user.sub, name: user.name ?? '', email: user.email ?? '' });
            frontendMonitoring.setUser({
                id: user.sub,
                email: user.email ?? '',
                username: user.name ?? '',
            });
        } else if (!isLoading && !user) {
            setIsAuthenticated(false);
            setUser(null);
            frontendMonitoring.setUser(null);
        }
    }, [isLoading, user, setUser, setIsAuthenticated, setIsLoading]);

    return <>{children}</>;
};

export default AuthProvider;
