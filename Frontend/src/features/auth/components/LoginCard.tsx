'use client';

import { useUser } from '@auth0/nextjs-auth0';
import Link from 'next/link';
import React from 'react';

import { AUTH0_URLS } from '@shared/api';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';

const LoginCard: React.FC = () => {
    const { user } = useUser();

    return (
        <Card className="z-1 h-44 w-96 justify-around rounded-2xl border-0">
            <CardHeader>
                <CardTitle>MailSense</CardTitle>
                <CardDescription>Unified Inbox. Intelligent Focus</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex w-full flex-col items-center gap-4">
                    {user ? (
                        <Link href={AUTH0_URLS.LOGOUT}>
                            <Button className="cursor-pointer px-20">Logout</Button>
                        </Link>
                    ) : (
                        <Link href={AUTH0_URLS.LOGIN}>
                            <Button className="cursor-pointer px-20">Login</Button>
                        </Link>
                    )}
                    {user && <p>{user.name}</p>}
                </div>
            </CardContent>
        </Card>
    );
};

export default LoginCard;
