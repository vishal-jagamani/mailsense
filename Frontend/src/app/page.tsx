'use client';

import { AUTH0_URLS } from '@/shared/constants';
import { useUser } from '@auth0/nextjs-auth0';
import Link from 'next/link';

export default function Home() {
    const { user } = useUser();

    return (
        <>
            <div className="flex h-screen w-screen items-center justify-center gap-4">
                <p className="text-2xl font-bold">MailSense</p>
                {user ? <Link href={AUTH0_URLS.LOGOUT}>Logout</Link> : <Link href={AUTH0_URLS.LOGIN}>Login</Link>}
                {user && <p>{user.name}</p>}
            </div>
        </>
    );
}
