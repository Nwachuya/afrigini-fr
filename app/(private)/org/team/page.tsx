'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import pb from '@/lib/pocketbase';
import { OrgInviteRecord, OrgRole, UserRecord } from '@/types';
import { canManageTeam, canViewTeam, getDefaultOrgPath } from '@/lib/access';
import { getCurrentOrgMembership } from '@/lib/org-membership';

type TeamMessage = {
  text: string;
  type: '' | 'success' | 'error';
};

type TeamMember = {
  id: string;
  user: string;
  role: OrgRole;
  created: string;
  updated: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
};

type PendingAction =
  | {
      kind: 'invite-owner';
      email: string;
      role: OrgRole;
    }
  | {
      kind: 'remove-member';
      member: TeamMember;
    }
  | {
      kind: 'revoke-invite';
      invite: OrgInviteRecord;
    }
  | null;

const ROLE_OPTIONS: Array<{
  value: OrgRole;
  label: string;
  description: string;
}> = [
  {
    value: 'recruiter',
    label: 'Recruiter',
    description: 'Can manage jobs, candidates, and applications.',
  },
  {
    value: 'billing',
    label: 'Billing',
    description: 'Can access billing and invoice-related settings.',
  },
  {
    value: 'owner',
    label: 'Owner',
    description: 'Has full organization access, including team management.',
  },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function TeamPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<TeamMessage>({ text: '', type: '' });
  const [loadError, setLoadError] = useState('');
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const [user, setUser] = useState<UserRecord | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [memberRole, setMemberRole] = useState<OrgRole | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<OrgInviteRecord[]>([]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('recruiter');

  const canManage = canManageTeam(memberRole);
  const ownerCount = members.filter((member) => member.role === 'owner').length;

  useEffect(() => {
    let isActive = true;

    const init = async () => {
      try {
        setLoadError('');

        const currentUser = pb.authStore.model as unknown as UserRecord;
        if (!currentUser) {
          router.push('/login');
          return;
        }

        const memberRes = await getCurrentOrgMembership(currentUser.id);

        if (!isActive) {
          return;
        }

        if (memberRes && memberRes.organization && canViewTeam(memberRes.role)) {
          setUser(currentUser);
          setMemberRole(memberRes.role ?? null);
          setOrgId(memberRes.organization);
          await fetchData(memberRes.organization, canManageTeam(memberRes.role), false);
          return;
        }

        if (memberRes?.role) {
          router.replace(getDefaultOrgPath(memberRes.role));
          return;
        }

        setLoadError('No organization membership was found for your account.');
      } catch (error) {
        console.error('Error loading team data:', error);
        if (isActive) {
          setLoadError('We could not load your team workspace. Please try again.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void init();

    return () => {
      isActive = false;
    };
  }, [router]);

  const fetchData = async (
    organizationId: string,
    allowManage: boolean,
    showRefreshing = true
  ): Promise<boolean> => {
    if (showRefreshing) {
      setRefreshing(true);
    }

    try {
      setLoadError('');

      const authHeader = pb.authStore.token
        ? { Authorization: `Bearer ${pb.authStore.token}` }
        : undefined;
      const membersResponse = await fetch(`/api/org/team/members?orgId=${encodeURIComponent(organizationId)}`, {
        method: 'GET',
        headers: authHeader,
        cache: 'no-store',
        credentials: 'same-origin',
      });
      const membersPayload = await membersResponse.json();

      if (!membersResponse.ok) {
        // Fallback to direct member query if server-session cookies are stale.
        const fallbackMembers = await pb.collection('org_members').getFullList({
          filter: `organization = "${organizationId}"`,
          sort: 'role',
          requestKey: null,
        });
        setMembers((fallbackMembers as unknown as TeamMember[]).map((member) => ({
          id: member.id,
          user: member.user,
          role: member.role,
          created: member.created,
          updated: member.updated,
          userName: '',
          userEmail: '',
          userAvatar: '',
        })));
      } else {
        setMembers((membersPayload?.members || []) as TeamMember[]);
      }

      if (allowManage) {
        const invitesRes = await pb.collection('org_invites').getFullList({
          filter: `organization = "${organizationId}"`,
          sort: '-created',
        });
        setInvites(invitesRes as unknown as OrgInviteRecord[]);
      } else {
        setInvites([]);
      }

      return true;
    } catch (error) {
      console.error('Fetch error', error);
      setLoadError('We could not refresh team members and invitations.');
      return false;
    } finally {
      if (showRefreshing) {
        setRefreshing(false);
      }
    }
  };

  const createInvite = async (email: string, role: OrgRole) => {
    if (!orgId || !user) {
      return;
    }

    setInviting(true);
    setMessage({ text: '', type: '' });

    try {
      await pb.collection('org_invites').create({
        organization: orgId,
        email,
        role,
        invited_by: user.id,
      });

      setMessage({ text: `Invitation sent to ${email}.`, type: 'success' });
      setInviteEmail('');
      setPendingAction(null);
      await fetchData(orgId, true);
    } catch (err: any) {
      const errMsg = err?.data?.data?.email?.message || err.message || 'Failed to send invite.';
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setInviting(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail || !orgId || !user || !canManage) {
      return;
    }

    setMessage({ text: '', type: '' });

    try {
      const normalizedEmail = inviteEmail.trim().toLowerCase();

      if (invites.some((invite) => invite.email.toLowerCase() === normalizedEmail)) {
        throw new Error('There is already a pending invitation for this email.');
      }

      if (inviteRole === 'owner') {
        setPendingAction({
          kind: 'invite-owner',
          email: normalizedEmail,
          role: inviteRole,
        });
        return;
      }

      await createInvite(normalizedEmail, inviteRole);
    } catch (err: any) {
      const errMsg = err?.data?.data?.email?.message || err.message || 'Failed to send invite.';
      setMessage({ text: errMsg, type: 'error' });
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (!orgId || !canManage || removingMemberId || member.user === user?.id) {
      return;
    }

    if (member.role === 'owner' && ownerCount <= 1) {
      setMessage({ text: 'At least one owner must remain on the organization.', type: 'error' });
      return;
    }

    setPendingAction({ kind: 'remove-member', member });
  };

  const removeMember = async (member: TeamMember) => {
    if (!orgId) {
      return;
    }

    const organizationId = orgId;
    setRemovingMemberId(member.id);
    setMessage({ text: '', type: '' });

    try {
      await pb.collection('org_members').delete(member.id);
      setMessage({
        text: `Removed ${member.userEmail || 'team member'} from the organization.`,
        type: 'success',
      });
      await fetchData(organizationId, true);
    } catch (err: any) {
      setMessage({ text: err?.message || 'Failed to remove team member.', type: 'error' });
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleRevokeInvite = async (invite: OrgInviteRecord) => {
    if (!orgId || !canManage || revokingInviteId) {
      return;
    }

    setPendingAction({ kind: 'revoke-invite', invite });
  };

  const revokeInvite = async (invite: OrgInviteRecord) => {
    if (!orgId) {
      return;
    }

    const organizationId = orgId;
    setRevokingInviteId(invite.id);
    setMessage({ text: '', type: '' });

    try {
      await pb.collection('org_invites').delete(invite.id);
      setMessage({ text: `Revoked the invitation for ${invite.email}.`, type: 'success' });
      await fetchData(organizationId, true);
    } catch (err: any) {
      setMessage({ text: err?.message || 'Failed to revoke invitation.', type: 'error' });
    } finally {
      setRevokingInviteId(null);
    }
  };

  const handleConfirmPendingAction = async () => {
    if (!pendingAction) {
      return;
    }

    if (pendingAction.kind === 'invite-owner') {
      await createInvite(pendingAction.email, pendingAction.role);
      return;
    }

    if (pendingAction.kind === 'remove-member') {
      await removeMember(pendingAction.member);
      setPendingAction(null);
      return;
    }

    await revokeInvite(pendingAction.invite);
    setPendingAction(null);
  };

  const pendingActionTitle =
    pendingAction?.kind === 'invite-owner'
      ? 'Confirm owner invitation'
      : pendingAction?.kind === 'remove-member'
        ? 'Confirm member removal'
        : pendingAction?.kind === 'revoke-invite'
          ? 'Confirm invitation revocation'
          : '';

  const pendingActionDescription =
    pendingAction?.kind === 'invite-owner'
      ? `${pendingAction.email} will be invited as an owner with full team, billing, and organization access.`
      : pendingAction?.kind === 'remove-member'
        ? pendingAction.member.role === 'owner'
          ? `Removing ${pendingAction.member.userEmail || 'this owner'} will revoke all organization access.`
          : `Remove ${pendingAction.member.userEmail || 'this team member'} from the organization.`
        : pendingAction?.kind === 'revoke-invite'
          ? `This will cancel the pending invitation for ${pendingAction.invite.email}.`
          : '';

  const pendingActionBusy =
    (pendingAction?.kind === 'invite-owner' && inviting) ||
    (pendingAction?.kind === 'remove-member' &&
      pendingAction.member.id === removingMemberId) ||
    (pendingAction?.kind === 'revoke-invite' &&
      pendingAction.invite.id === revokingInviteId);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500">
        Loading team...
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
          {loadError || 'Could not load organization.'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <div>
        <span className="text-brand-green font-bold tracking-[0.2em] uppercase text-xs">Organization</span>
        <h1 className="mt-2 text-3xl font-bold text-brand-dark">
          {canManage ? 'Team Management' : 'Team Directory'}
        </h1>
        <p className="text-gray-500 mt-1">
          {canManage
            ? 'Owners can invite teammates, assign roles, and remove access.'
            : 'You have read-only access to your organization team directory.'}
        </p>
      </div>

      {!canManage && (
        <div className="rounded-2xl border border-brand-green/15 bg-brand-green/5 px-5 py-4 text-sm text-brand-dark">
          Only organization owners can invite teammates, revoke invitations, or remove members.
          You can still review the current directory below.
        </div>
      )}

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {message.text && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm ${
            message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {pendingAction && (
        <div className="rounded-2xl border border-brand-green/15 bg-brand-green/5 px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-dark">{pendingActionTitle}</p>
              <p className="mt-1 text-sm text-gray-600">{pendingActionDescription}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={pendingActionBusy}
                className="rounded-lg border border-brand-green/20 bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-green/5 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmPendingAction()}
                disabled={pendingActionBusy}
                className="rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-800 disabled:opacity-60"
              >
                {pendingActionBusy ? 'Working...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start xl:order-1">
          <div className="grid grid-cols-2 gap-4">
            <SummaryCard
              label="Members"
              value={members.length}
              helper="Active teammates"
            />
            <SummaryCard
              label="Pending Invites"
              value={canManage ? invites.length : 'Restricted'}
              helper={canManage ? 'Need owner review' : 'Owner only'}
            />
          </div>

          {canManage && (
            <div className="rounded-2xl border border-brand-green/10 bg-white shadow-sm">
              <div className="border-b border-brand-green/10 p-6">
                <h2 className="text-lg font-semibold text-brand-dark">Invite New Member</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Only owners can send invitations. Choose the minimum role needed for this teammate.
                </p>
              </div>
              <form onSubmit={handleInvite} className="p-6 space-y-4">
                <div className="space-y-4">
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all focus:border-brand-green focus:ring-2 focus:ring-brand-green"
                  />
                  <div className="relative">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                      className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-3 pl-4 pr-14 text-gray-900 outline-none transition-all focus:border-brand-green focus:ring-2 focus:ring-brand-green"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center px-2 text-brand-green">
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </div>
                </div>
                <p className={`text-sm ${inviteRole === 'owner' ? 'text-amber-700' : 'text-gray-500'}`}>
                  {ROLE_OPTIONS.find((role) => role.value === inviteRole)?.description}
                </p>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={inviting}
                    className="rounded-lg bg-brand-green px-6 py-2.5 font-medium text-white transition-colors hover:bg-green-800 disabled:opacity-70"
                  >
                    {inviting ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {canManage && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-brand-dark">Pending Invitations</h2>
              <div className="rounded-2xl border border-brand-green/10 bg-white shadow-sm">
                {invites.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-gray-500">
                    No pending invitations.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {invites.map((invite) => (
                      <li key={invite.id} className="p-4 flex justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-brand-dark">{invite.email}</p>
                          <p className="text-sm text-gray-400">
                            Invited on {formatDate(invite.created)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <span className="rounded-full border border-brand-green/15 bg-brand-green/10 px-3 py-1 text-xs font-medium capitalize text-brand-green">
                            {invite.role}
                          </span>
                          <button
                            onClick={() => void handleRevokeInvite(invite)}
                            disabled={revokingInviteId === invite.id}
                            className="text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-60"
                          >
                            {revokingInviteId === invite.id ? 'Revoking...' : 'Revoke'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </aside>

        <div className="xl:order-2">
          <h2 className="mb-4 text-lg font-semibold text-brand-dark">Current Members</h2>
          <div className="rounded-2xl border border-brand-green/10 bg-white shadow-sm">
            {members.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-500">
                No organization members were found.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {members.map((member) => {
                  const isCurrentUser = user?.id === member.user;
                  const displayName =
                    member.userName ||
                    member.userEmail ||
                    (isCurrentUser ? user?.name || user?.email || 'You' : 'Team member');
                  const secondaryLine =
                    member.userEmail ||
                    (isCurrentUser ? user?.email || 'Signed in account' : 'Profile details unavailable');
                  const initial = displayName?.[0]?.toUpperCase() || 'U';

                  return (
                    <li key={member.id} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        {member.userAvatar ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${member.user}/${member.userAvatar}`}
                            alt={displayName}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                            {initial}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-brand-dark break-words">
                            {displayName}
                            {isCurrentUser && (
                              <span className="ml-2 rounded-full border border-brand-green/15 bg-brand-green/10 px-2 py-0.5 text-xs font-medium text-brand-green">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500 break-all">{secondaryLine}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-4 self-start sm:self-center">
                        <span className="rounded-full border border-brand-green/15 bg-brand-green/10 px-3 py-1 text-xs font-medium capitalize text-brand-green">
                          {member.role}
                        </span>
                        {canManage && user?.id !== member.user && (
                          <button
                            onClick={() => void handleRemoveMember(member)}
                            disabled={removingMemberId === member.id}
                            className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-60"
                          >
                            {removingMemberId === member.id ? 'Removing...' : 'Remove'}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {refreshing && <div className="text-sm text-gray-500">Refreshing team data...</div>}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  className = '',
}: {
  label: string;
  value: string | number;
  helper: string;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-brand-green/10 bg-white px-5 py-4 shadow-sm ${className}`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-brand-dark">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{helper}</p>
    </div>
  );
}
