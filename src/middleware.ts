import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const BOT_PATTERNS = [
  /curl\//i, /wget\//i, /python-requests/i, /scrapy/i, /httpx/i,
  /axios\/[0-9]/i, /got\//i, /node-fetch/i, /java\//i, /okhttp/i,
  /go-http-client/i, /libwww-perl/i,
];

const BLOCKED_IPS: string[] = [];

// Routes that do NOT require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/score',
  '/api/parse-pdf',
  '/api/health',
  '/api/user/sync', // Clerk webhook — verified by Svix signature
  '/api/payments/(.*)', // auth handled inside each route
]);

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/user/me(.*)',
  '/api/user/resumes(.*)',
]);

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

function isSuspiciousUA(ua: string | null): boolean {
  if (!ua || ua.length < 10) return true;
  return BOT_PATTERNS.some((p) => p.test(ua));
}

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);

  // Block known bad IPs
  if (BLOCKED_IPS.includes(ip)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Block obvious bots on the score endpoint
  if (pathname === '/api/score' && isSuspiciousUA(request.headers.get('user-agent'))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Protect dashboard and user-specific API routes
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  // Attach real IP for downstream rate limiting
  const response = NextResponse.next();
  response.headers.set('x-real-client-ip', ip);
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
