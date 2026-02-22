import { NextResponse, type NextRequest } from 'next/server';
import { auth0 } from './lib/auth0';

export async function middleware(request: NextRequest) {
    const res = await auth0.middleware(request);

    const session = await auth0.getSession(request);

    const publicPaths = ['/login', '/get_started', '/auth'];
    const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path));

    if (!session?.user && !isPublicPath) {
        const loginURL = new URL('/get_started', request.url);
        return NextResponse.redirect(loginURL);
    }
    return res;
}

export const config = {
    matcher: [
        /*
         * Apply middleware to all paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
