'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import pb from '@/lib/pocketbase';
import { UserRecord } from '@/types';
import Link from 'next/link';

export default function OrganizationDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);
  
  // Data States
  const [stats, setStats] = useState({ activeJobs: 0, totalApplicants: 0, interviews: 0 });
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!pb.authStore.isValid) {
          router.replace('/login');
          return;
        }

        const freshUser = await pb.collection('users').getOne(pb.authStore.model!.id);
        const userRecord = freshUser as unknown as UserRecord;

        if (userRecord.role === 'Applicant') {
          router.replace('/dashboard/applicant');
          return;
        }

        setUser(userRecord);

        // 1. Get Org
        const membership = await pb.collection('org_members').getFirstListItem(
          `user = "${freshUser.id}"`, 
          { expand: 'organization', requestKey: null }
        );
        
        const org = membership?.expand?.organization;
        const id = org?.id;
        setOrgName(org?.name || 'Your Company');
        setOrgId(id);

        if (id) {
          // 2. Parallel Data Fetching
          const [jobsRes, appsRes, interviewsRes, recentAppsRes, recentJobsRes] = await Promise.all([
            // Stats: Active Jobs
            pb.collection('jobs').getList(1, 1, {
              filter: `organization = "${id}" && stage = "Open"`,
              requestKey: null
            }),
            // Stats: Total Applications
            pb.collection('job_applications').getList(1, 1, {
              filter: `job.organization = "${id}"`,
              requestKey: null
            }),
            // Stats: Interviews
            pb.collection('job_applications').getList(1, 1, {
              filter: `job.organization = "${id}" && (stage = "Interview" || stage = "Invited")`,
              requestKey: null
            }),
            // List: Recent Applications (Limit 5)
            pb.collection('job_applications').getList(1, 5, {
              filter: `job.organization = "${id}"`,
              sort: '-created',
              expand: 'job,applicant',
              requestKey: null
            }),
            // List: Recent Jobs (Limit 3)
            pb.collection('jobs').getList(1, 3, {
              filter: `organization = "${id}" && stage = "Open"`,
              sort: '-created',
              requestKey: null
            })
          ]);

          setStats({
            activeJobs: jobsRes.totalItems,
            totalApplicants: appsRes.totalItems,
            interviews: interviewsRes.totalItems,
          });
          setRecentApps(recentAppsRes.items);
          setRecentJobs(recentJobsRes.items);
        }
      } catch (e) {
        console.error("Error fetching dashboard data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500">Loading dashboard...</div>;
  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user.name || 'Recruiter'}. Here's what's happening at <span className="font-semibold text-gray-700">{orgName}</span>.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/find-candidates" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            Find Talent
          </Link>
          <Link href="/manage-jobs/new" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Post Job
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Jobs</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeJobs}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Candidates</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalApplicants}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Interviews</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.interviews}</p>
          </div>
          <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Applications */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Applications</h2>
            <Link href="/applications" className="text-sm text-blue-600 hover:text-blue-800 font-medium">View All &rarr;</Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {recentApps.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                <p>No applications received yet.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-gray-700">Candidate</th>
                    <th className="px-6 py-3 font-semibold text-gray-700">Role</th>
                    <th className="px-6 py-3 font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-3 font-semibold text-gray-700 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentApps.map((app) => {
                    const applicant = app.expand?.applicant;
                    const job = app.expand?.job;
                    return (
                      <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {applicant?.firstName} {applicant?.lastName}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{job?.role}</td>
                        <td className="px-6 py-4 text-gray-500">{new Date(app.created).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/applications/${app.id}`} className="text-blue-600 hover:text-blue-800 font-medium">Review</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Quick Links & Active Jobs */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Active Jobs List */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Latest Jobs</h2>
            {recentJobs.length === 0 ? (
              <p className="text-sm text-gray-500">No active jobs.</p>
            ) : (
              <div className="space-y-4">
                {recentJobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-gray-900 truncate max-w-[180px]">{job.role}</p>
                      <p className="text-xs text-gray-500">{job.type}</p>
                    </div>
                    <Link href={`/manage-jobs/${job.id}`} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200">
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link href="/manage-jobs" className="text-sm text-blue-600 hover:text-blue-800 font-medium block text-center">
                Manage All Jobs
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/dashboard/team" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700">
                <div className="bg-green-100 p-2 rounded-md text-green-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                </div>
                <span className="font-medium text-sm">Invite Team Member</span>
              </Link>
              <Link href="/dashboard/organization-settings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700">
                <div className="bg-gray-100 p-2 rounded-md text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <span className="font-medium text-sm">Company Settings</span>
              </Link>
              <Link href="/dashboard/billing" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700">
                <div className="bg-yellow-100 p-2 rounded-md text-yellow-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </div>
                <span className="font-medium text-sm">Billing & Credits</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
