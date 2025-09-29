import { NextResponse, type NextRequest } from 'next/server';
import { auth0 } from './lib/auth0';

export async function middleware(request: NextRequest) {
    // Get the current session
    const session = await auth0.getSession(request);

    // Define public routes (accessible without login)
    const publicPaths = ['/login', '/get_started', '/auth'];
    const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path));

    // If no session and not on a public path → redirect to /get_started
    if (!session?.user && !isPublicPath) {
        return NextResponse.redirect(new URL('/get_started', request.url));
    }

    // Run Auth0’s built-in middleware (for token refresh, etc.)
    return auth0.middleware(request);
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
