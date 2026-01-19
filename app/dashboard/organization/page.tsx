'use client';

import { useEffect, useState } from 'react';
import pb from '@/lib/pocketbase';
import { UserRecord } from '@/types';
import Link from 'next/link';

export default function OrganizationDashboard() {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [orgName, setOrgName] = useState('');
  const [stats, setStats] = useState({ activeJobs: 0, totalApplicants: 0, interviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = pb.authStore.model as unknown as UserRecord;
        setUser(currentUser);

        if (currentUser) {
          // 1. Find the user's organization
          // We assume user is 'owner' or member of at least one org for this MVP
          const membership = await pb.collection('org_members').getFirstListItem(
            `user = "${currentUser.id}"`, 
            { expand: 'organization' }
          );
          
          const org = membership?.expand?.organization;
          const orgId = org?.id;
          setOrgName(org?.name || 'Your Company');

          if (orgId) {
            // 2. Count Active Jobs (Stage = Open)
            const jobsRes = await pb.collection('jobs').getList(1, 1, {
              filter: `organization = "${orgId}" && stage = "Open"`,
            });

            // 3. Count Total Applicants (Where job belongs to org)
            const appsRes = await pb.collection('job_applications').getList(1, 1, {
              filter: `job.organization = "${orgId}"`,
            });
            
             // 4. Count Interviews
            const interviewsRes = await pb.collection('job_applications').getList(1, 1, {
              filter: `job.organization = "${orgId}" && (stage = "Interview" || stage = "Invited")`,
            });

            setStats({
              activeJobs: jobsRes.totalItems,
              totalApplicants: appsRes.totalItems,
              interviews: interviewsRes.totalItems,
            });
          }
        }
      } catch (e) {
        console.error("Error fetching org data", e);
        // Fallback if no org found
        setOrgName('Your Organization');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading dashboard...</div>;
  if (!user) return <div className="p-8">Please log in.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="h-16 w-16 rounded-lg bg-indigo-100 flex items-center justify-center text-2xl">
            🏢
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{orgName}</h1>
            <p className="text-gray-500 mt-1">Recruitment Overview</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/manage-jobs/new" className="px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm flex items-center">
            <span className="mr-2">+</span> Post a New Job
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 font-medium">Active Jobs</h3>
            <span className="text-indigo-600 bg-indigo-50 p-2 rounded-lg">💼</span>
          </div>
          <p className="text-3xl font-bold mt-2 text-gray-900">{stats.activeJobs}</p>
          <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '40%' }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 font-medium">Total Candidates</h3>
            <span className="text-orange-600 bg-orange-50 p-2 rounded-lg">👥</span>
          </div>
          <p className="text-3xl font-bold mt-2 text-gray-900">{stats.totalApplicants}</p>
           <p className="text-sm text-gray-400 mt-2">Across all open roles</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 font-medium">Interviews Scheduled</h3>
            <span className="text-teal-600 bg-teal-50 p-2 rounded-lg">📅</span>
          </div>
          <p className="text-3xl font-bold mt-2 text-gray-900">{stats.interviews}</p>
           <p className="text-sm text-gray-400 mt-2">Upcoming this week</p>
        </div>
      </div>
    </div>
  );
}
