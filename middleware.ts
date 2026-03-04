import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { UserRole } from '@/types';
import {
  canAccessCandidateNamespace,
  canAccessOrgNamespace,
  getDefaultDashboardPath,
} from '@/lib/access';
import {
  APP_SESSION_COOKIE,
  PB_TOKEN_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
  isSessionConfigured,
} from '@/lib/session';

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password'];
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const VALID_ROLES: UserRole[] = ['Applicant', 'Company', 'recruiter', 'billing', 'owner'];

type RefreshedUser = {
  id: string;
  role: UserRole;
  email?: string;
};

type AuthRefreshResult = {
  token: string;
  record: RefreshedUser;
};

function clearAuthCookies(response: NextResponse) {
  response.cookies.set(APP_SESSION_COOKIE, '', {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });
  response.cookies.set(PB_TOKEN_COOKIE, '', {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

async function refreshPocketBaseSession(token: string): Promise<AuthRefreshResult | null> {
  try {
    const response = await fetch(`${PB_URL}/api/collections/users/auth-refresh`, {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (
      typeof data?.token !== 'string' ||
      typeof data?.record?.id !== 'string' ||
      typeof data?.record?.role !== 'string' ||
      (data?.record?.email !== undefined && typeof data.record.email !== 'string')
    ) {
      return null;
    }

    if (!VALID_ROLES.includes(data.record.role as UserRole)) {
      return null;
    }

    return {
      token: data.token,
      record: {
        id: data.record.id,
        role: data.record.role as UserRole,
        email: data.record.email,
      },
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const isCandidatePath = pathname.startsWith('/candidates');
  const isOrgPath = pathname.startsWith('/org');
  const pbToken = request.cookies.get(PB_TOKEN_COOKIE)?.value;
  const sessionConfigured = isSessionConfigured();

  if (!pbToken) {
    if (isPublicPath) {
      const response = NextResponse.next();
      clearAuthCookies(response);
      return response;
    }

    const response = redirectToLogin(request, pathname);
    clearAuthCookies(response);
    return response;
  }

  const refreshed = await refreshPocketBaseSession(pbToken);
  if (!refreshed) {
    if (isPublicPath) {
      const response = NextResponse.next();
      clearAuthCookies(response);
      return response;
    }

    const response = redirectToLogin(request, pathname);
    clearAuthCookies(response);
    return response;
  }

  const dashboardPath = getDefaultDashboardPath(refreshed.record.role);

  const applyAuthCookies = async (response: NextResponse) => {
    response.cookies.set(PB_TOKEN_COOKIE, refreshed.token, SESSION_COOKIE_OPTIONS);

    if (sessionConfigured) {
      const nextSessionToken = await createSessionToken({
        userId: refreshed.record.id,
        role: refreshed.record.role,
        email: refreshed.record.email,
      });
      response.cookies.set(APP_SESSION_COOKIE, nextSessionToken, SESSION_COOKIE_OPTIONS);
    } else {
      response.cookies.set(APP_SESSION_COOKIE, '', {
        ...SESSION_COOKIE_OPTIONS,
        maxAge: 0,
      });
    }

    return response;
  };

  if (isPublicPath) {
    const response = NextResponse.redirect(new URL(dashboardPath, request.url));
    return applyAuthCookies(response);
  }

  if (isCandidatePath && !canAccessCandidateNamespace(refreshed.record.role)) {
    const response = NextResponse.redirect(new URL(dashboardPath, request.url));
    return applyAuthCookies(response);
  }

  if (isOrgPath && !canAccessOrgNamespace(refreshed.record.role)) {
    const response = NextResponse.redirect(new URL(dashboardPath, request.url));
    return applyAuthCookies(response);
  }

  const response = NextResponse.next();
  return applyAuthCookies(response);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon|.*\\..*).*)',
  ],
};
