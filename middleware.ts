import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the pb_auth cookie
  const authCookie = request.cookies.get('pb_auth')?.value;
  
  let isAuthenticated = false;
  let userRole: string | null = null;
  
  if (authCookie) {
    try {
      let cookieValue = authCookie;
      
      if (cookieValue.startsWith('%7B')) {
        cookieValue = decodeURIComponent(cookieValue);
      }
      
      const parsed = JSON.parse(cookieValue);
      
      if (parsed.token && parsed.model) {
        isAuthenticated = true;
        userRole = parsed.model.role || null;
      }
    } catch (e) {
      isAuthenticated = false;
    }
  }
  
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  
  // Authenticated user on public page → redirect to dashboard
  if (isAuthenticated && isPublicPath) {
    const dashboardPath = userRole === 'Applicant' 
      ? '/dashboard/applicant' 
      : '/dashboard/organization';
    
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }
  
  // Unauthenticated user on protected page → redirect to login
  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon|.*\\..*).*)',
  ],
};