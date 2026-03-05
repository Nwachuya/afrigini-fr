import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { canViewTeam } from '@/lib/access';
import { APP_SESSION_COOKIE, PB_TOKEN_COOKIE, verifySessionToken } from '@/lib/session';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pb.afrigini.com';
export const dynamic = 'force-dynamic';

type TeamMemberRecord = {
  id: string;
  user: string;
  role: string;
  created: string;
  updated: string;
};

type TeamUserRecord = {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
};

type TeamMemberResponse = {
  id: string;
  user: string;
  role: string;
  created: string;
  updated: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
};

function buildIdEqualsFilter(field: string, ids: string[]): string {
  if (!ids.length) {
    return '';
  }

  return ids.map((id) => `${field} = "${id}"`).join(' || ');
}

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('orgId');
    const sessionCookie = request.cookies.get(APP_SESSION_COOKIE)?.value;
    const sessionData = sessionCookie ? await verifySessionToken(sessionCookie) : null;
    const cookiePbToken = request.cookies.get(PB_TOKEN_COOKIE)?.value;
    const authHeader = request.headers.get('authorization') || '';
    const bearerPbToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const pbToken = cookiePbToken || bearerPbToken;

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
    }

    if (!pbToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPb = new PocketBase(PB_URL);
    userPb.authStore.save(pbToken, null);

    let authenticatedUserId = sessionData?.userId ?? '';
    if (!authenticatedUserId) {
      try {
        const authData = await userPb.collection('users').authRefresh({ requestKey: null });
        authenticatedUserId = authData?.record?.id || '';
      } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    let membership: { role?: string } | null = null;
    try {
      membership = await userPb.collection('org_members').getFirstListItem(
        `user = "${authenticatedUserId}" && organization = "${orgId}"`,
        { requestKey: null }
      );
    } catch {
      membership = null;
    }

    if (!membership?.role || !canViewTeam(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const adminPb = new PocketBase(PB_URL);
    await adminPb.admins.authWithPassword(adminEmail, adminPassword);

    const members = await adminPb.collection('org_members').getFullList<TeamMemberRecord>({
      filter: `organization = "${orgId}"`,
      sort: 'role',
      requestKey: null,
    });
    const userIds = Array.from(new Set(members.map((member) => member.user).filter(Boolean)));
    const userFilter = buildIdEqualsFilter('id', userIds);

    let users: TeamUserRecord[] = [];
    if (userFilter) {
      users = await adminPb.collection('users').getFullList<TeamUserRecord>({
        filter: userFilter,
        requestKey: null,
      });
    }

    const usersById = new Map(users.map((user) => [user.id, user]));

    return NextResponse.json({
      members: members.map((member): TeamMemberResponse => {
        const matchedUser = usersById.get(member.user);
        return {
          id: member.id,
          user: member.user,
          role: member.role,
          created: member.created,
          updated: member.updated,
          userName: matchedUser?.name || '',
          userEmail: matchedUser?.email || '',
          userAvatar: matchedUser?.avatar || '',
        };
      }),
    });
  } catch (error) {
    console.error('Failed to load org team members:', error);
    return NextResponse.json({ error: 'Failed to load team members' }, { status: 500 });
  }
}
