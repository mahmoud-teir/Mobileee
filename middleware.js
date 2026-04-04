import { NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/init',
  '/api/health',
  '/',
];

export function middleware(request) {
  const { pathname, hostname } = request.nextUrl;

  // Extract store slug (from subdomain or header)
  let storeSlug = request.headers.get('x-store-slug');
  
  // If no header, try to get from subdomain (e.g. shop1.smartstore.com)
  if (!storeSlug && hostname !== 'localhost' && !hostname.includes('vercel.app')) {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      storeSlug = parts[0];
    }
  }

  const requestHeaders = new Headers(request.headers);
  if (storeSlug) {
    requestHeaders.set('x-store-slug', storeSlug);
  }

  // Skip non-API routes and public API paths
  if (!pathname.startsWith('/api') || PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });
}

export const config = {
  matcher: '/api/:path*',
};
