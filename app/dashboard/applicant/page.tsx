'use client';

import { useEffect, useState } from 'react';
import pb from '@/lib/pocketbase';
import { UserRecord } from '@/types';
import Link from 'next/link';

export default function ApplicantDashboard() {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [stats, setStats] = useState({ applied: 0, interviews: 0, accepted: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = pb.authStore.model as unknown as UserRecord;
        setUser(currentUser);

        if (currentUser) {
          // 1. Get total applications count
          const appliedRes = await pb.collection('job_applications').getList(1, 1, {
            filter: `applicant.user = "${currentUser.id}"`,
          });

          // 2. Get interviews count (Stage is 'Interview' or 'Invited')
          const interviewRes = await pb.collection('job_applications').getList(1, 1, {
            filter: `applicant.user = "${currentUser.id}" && (stage = "Interview" || stage = "Invited")`,
          });

          // 3. Get accepted count
          const acceptedRes = await pb.collection('job_applications').getList(1, 1, {
            filter: `applicant.user = "${currentUser.id}" && stage = "Accepted"`,
          });

          setStats({
            applied: appliedRes.totalItems,
            interviews: interviewRes.totalItems,
            accepted: acceptedRes.totalItems,
          });
        }
      } catch (e) {
        console.error("Error fetching dashboard data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading dashboard...</div>;
  if (!user) return <div className="p-8">Please log in.</div>;

  // Avatar URL helper
  const avatarUrl = user.avatar 
    ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${user.id}/${user.avatar}` 
    : null;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header / Greeting */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-6">
        <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-blue-50">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-blue-600">{user.email?.[0].toUpperCase()}</span>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hello, {user.name || 'Applicant'}!</h1>
          <p className="text-gray-500 mt-1">Welcome back to your job search portal.</p>
          <div className="mt-3 flex space-x-3">
             <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
               Open to Work
             </span>
             {user.verified && (
               <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                 Verified
               </span>
             )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 font-medium">Applications Sent</h3>
            <span className="text-blue-600 bg-blue-50 p-2 rounded-lg">📤</span>
          </div>
          <p className="text-3xl font-bold mt-2 text-gray-900">{stats.applied}</p>
          <p className="text-sm text-gray-400 mt-2">Total active applications</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 font-medium">Interviews</h3>
            <span className="text-purple-600 bg-purple-50 p-2 rounded-lg">🎥</span>
          </div>
          <p className="text-3xl font-bold mt-2 text-gray-900">{stats.interviews}</p>
          <p className="text-sm text-gray-400 mt-2">Upcoming & Completed</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 font-medium">Offers</h3>
            <span className="text-green-600 bg-green-50 p-2 rounded-lg">🎉</span>
          </div>
          <p className="text-3xl font-bold mt-2 text-gray-900">{stats.accepted}</p>
          <p className="text-sm text-gray-400 mt-2">Accepted applications</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
        <div className="flex space-x-4">
          <Link href="/jobs" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
            Find New Jobs
          </Link>
          <Link href="/my-profile" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium">
            Update Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
