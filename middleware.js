import { NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/init',
  '/api/health',
  '/',
];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip non-API routes and public API paths
  if (!pathname.startsWith('/api') || PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
  }

  // Full JWT verification happens in each route handler via getAuthUser()
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
