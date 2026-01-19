'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import pb from '@/lib/pocketbase';
import { UserRecord, OrgMemberRecord, OrgInviteRecord } from '@/types';

interface ExpandedMember extends OrgMemberRecord {
  expand: {
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string;
    };
  };
}

export default function TeamPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [user, setUser] = useState<UserRecord | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [members, setMembers] = useState<ExpandedMember[]>([]);
  const [invites, setInvites] = useState<OrgInviteRecord[]>([]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('recruiter');

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = pb.authStore.model as unknown as UserRecord;
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        const memberRes = await pb.collection('org_members').getFirstListItem(
          `user = "${currentUser.id}"`,
          { requestKey: null }
        );
        
        if (memberRes && memberRes.organization) {
          setOrgId(memberRes.organization);
          await fetchData(memberRes.organization);
        } else {
          setMessage({ text: 'No organization found.', type: 'error' });
        }
      } catch (err) {
        console.error("Error loading team data:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  const fetchData = async (orgId: string) => {
    const membersRes = await pb.collection('org_members').getFullList({
      filter: `organization = "${orgId}"`,
      expand: 'user',
      sort: 'role',
    });
    setMembers(membersRes as unknown as ExpandedMember[]);

    const invitesRes = await pb.collection('org_invites').getFullList({
      filter: `organization = "${orgId}"`,
      sort: '-created',
    });
    setInvites(invitesRes as unknown as OrgInviteRecord[]);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !orgId || !user) return;
    
    setInviting(true);
    setMessage({ text: '', type: '' });

    try {
      await pb.collection('org_invites').create({
        organization: orgId,
        email: inviteEmail,
        role: inviteRole,
        invited_by: user.id,
      });
      setMessage({ text: `Invitation sent to ${inviteEmail}!`, type: 'success' });
      setInviteEmail('');
      await fetchData(orgId); // Refresh lists
    } catch (err: any) {
      setMessage({ text: err.data?.data?.email?.message || err.message || 'Failed to send invite.', type: 'error' });
    } finally {
      setInviting(false);
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500">Loading team...</div>;
  if (!orgId) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
        Could not load organization.
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <p className="text-gray-500 mt-1">Invite and manage members of your organization.</p>
      </div>

      {/* Invite Form Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Invite New Member</h2>
        </div>
        <form onSubmit={handleInvite} className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="recruiter">Recruiter</option>
              <option value="billing">Billing</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={inviting}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70 transition-colors"
            >
              {inviting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
          {message.text && (
            <p className={`mt-2 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </p>
          )}
        </form>
      </div>

      {/* Members & Invites Lists */}
      <div className="space-y-8">
        {/* Current Members */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Members</h2>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <ul className="divide-y divide-gray-100">
              {members.map(member => {
                const memberUser = member.expand?.user;
                return (
                  <li key={member.id} className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                        {memberUser?.name?.[0] || memberUser?.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{memberUser?.name || memberUser?.email}</p>
                        <p className="text-sm text-gray-500">{memberUser?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full capitalize">
                        {member.role}
                      </span>
                      {user?.id !== memberUser?.id && (
                        <button className="text-red-500 hover:text-red-700 text-sm font-medium">
                          Remove
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Pending Invites */}
        {invites.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Invitations</h2>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <ul className="divide-y divide-gray-100">
                {invites.map(invite => (
                  <li key={invite.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-700">{invite.email}</p>
                      <p className="text-sm text-gray-400">
                        Invited on {new Date(invite.created).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full capitalize">
                      {invite.role}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
