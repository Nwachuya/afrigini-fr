import { SignJWT, jwtVerify } from 'jose';
import { UserRole } from '@/types';

export const APP_SESSION_COOKIE = 'app_session';
export const PB_TOKEN_COOKIE = 'pb_token';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

type SessionPayload = {
  userId: string;
  role: UserRole;
  email?: string;
};

export function isSessionConfigured(): boolean {
  return typeof process.env.SESSION_SECRET === 'string' && process.env.SESSION_SECRET.length > 0;
}

function getSessionSecret(): Uint8Array {
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    throw new Error('Missing SESSION_SECRET environment variable.');
  }

  return new TextEncoder().encode(sessionSecret);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!isSessionConfigured()) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());

    if (
      typeof payload.userId !== 'string' ||
      typeof payload.role !== 'string' ||
      (payload.email !== undefined && typeof payload.email !== 'string')
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      role: payload.role as UserRole,
      email: payload.email,
    };
  } catch {
    return null;
  }
}
