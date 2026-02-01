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
      // pb_auth cookie is base64 encoded JSON
      const decoded = JSON.parse(atob(authCookie));
      
      // Check if token exists and model exists
      if (decoded.token && decoded.model) {
        isAuthenticated = true;
        userRole = decoded.model.role || null;
      }
    } catch (e) {
      // Invalid cookie, treat as unauthenticated
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
    // Save the attempted URL to redirect back after login
    loginUrl.searchParams.set('redirect', pathname);
    
    return NextResponse.redirect(loginUrl);
  }
  
  // Allow request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - static files
     * - _next
     * - favicon
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};