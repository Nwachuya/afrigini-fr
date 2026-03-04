import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import {
  APP_SESSION_COOKIE,
  PB_TOKEN_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
  isSessionConfigured,
} from '@/lib/session';
import { UserRecord } from '@/types';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

function clearCookie(response: NextResponse, name: string) {
  response.cookies.set(name, '', {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body?.token === 'string' ? body.token : '';

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const pb = new PocketBase(PB_URL);
    pb.authStore.save(token, null);

    const authData = await pb.collection('users').authRefresh({ requestKey: null });
    const user = authData.record as unknown as UserRecord;
    const response = NextResponse.json({
      ok: true,
      sessionConfigured: isSessionConfigured(),
    });

    if (isSessionConfigured()) {
      const sessionToken = await createSessionToken({
        userId: user.id,
        role: user.role,
        email: user.email,
      });
      response.cookies.set(APP_SESSION_COOKIE, sessionToken, SESSION_COOKIE_OPTIONS);
    } else {
      clearCookie(response, APP_SESSION_COOKIE);
    }

    response.cookies.set(PB_TOKEN_COOKIE, authData.token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearCookie(response, APP_SESSION_COOKIE);
  clearCookie(response, PB_TOKEN_COOKIE);
  return response;
}
