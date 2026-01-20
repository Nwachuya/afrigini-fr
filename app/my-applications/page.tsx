'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import pb from '@/lib/pocketbase';
import { UserRecord, CandidateProfileRecord, JobApplicationRecord } from '@/types';

// FIX: Use Omit to prevent type conflict with the base record
interface ExpandedApplication extends Omit<JobApplicationRecord, 'expand'> {
  expand: {
    job: {
      id: string;
      role: string;
      expand: {
        organization: {
          name: string;
          logo: string;
          id: string;
        }
      }
    }
  }
}

export default function MyApplicationsPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ExpandedApplication[]>([]);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const user = pb.authStore.model as unknown as UserRecord;
        if (!user || user.role !== 'Applicant') {
          router.push('/login');
          return;
        }

        let candidateProfile = null;
        try {
          candidateProfile = await pb.collection('candidate_profiles').getFirstListItem(
            `user = "${user.id}"`,
            { requestKey: null }
          );
        } catch (e) {
          console.log("No profile found");
          setLoading(false);
          return;
        }

        const result = await pb.collection('job_applications').getFullList({
          filter: `applicant = "${candidateProfile.id}"`,
          sort: '-created',
          expand: 'job.organization',
        });

        setApplications(result as unknown as ExpandedApplication[]);

      } catch (err) {
        console.error("Error loading applications:", err);
      } finally {
        setLoading(false);
      }
    };
    loadApplications();
  }, [router]);

  const getStatusColor = (stage: string) => {
    switch (stage) {
      case 'Applied': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Review': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'Interview': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Accepted': return 'bg-green-50 text-green-700 border-green-100';
      case 'Rejected': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">Loading your applications...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-500 mt-1">Track the status of your job applications.</p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900">You haven't applied to any jobs yet.</h3>
          <p className="text-gray-500 mb-6">Start exploring opportunities and submitting your applications.</p>
          <Link href="/jobs" className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Find Jobs
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {applications.map(app => {
              const job = app.expand?.job;
              const org = job?.expand?.organization;
              
              const logoUrl = org?.logo 
                ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/organizations/${org.id}/${org.logo}`
                : null;
              
              return (
                <li key={app.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <Link href={`/my-applications/${app.id}`} className="block">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 flex-shrink-0 text-gray-400 overflow-hidden">
                          {logoUrl ? (
                            <img src={logoUrl} alt={org?.name} className="h-full w-full object-contain" />
                          ) : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-gray-900">{job?.role}</p>
                          <p className="text-sm text-gray-600">{org?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:justify-end">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(app.stage)}`}>
                          {app.stage}
                        </span>
                        <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
