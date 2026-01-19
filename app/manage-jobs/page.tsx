'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import pb from '@/lib/pocketbase';
import { UserRecord, JobRecord } from '@/types';

export default function ManageJobsPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const user = pb.authStore.model as unknown as UserRecord;
        if (!user) return;

        const memberRes = await pb.collection('org_members').getFirstListItem(
          `user = "${user.id}"`
        );
        
        if (memberRes && memberRes.organization) {
          setOrgId(memberRes.organization);
          const jobsRes = await pb.collection('jobs').getList(1, 50, {
            filter: `organization = "${memberRes.organization}"`,
            sort: '-created',
          });
          setJobs(jobsRes.items as unknown as JobRecord[]);
        }
      } catch (err) {
        console.error("Error loading jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500">Loading your jobs...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Jobs</h1>
          <p className="text-gray-500">View and edit your active job listings.</p>
        </div>
        <Link 
          href="/manage-jobs/new" 
          className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-center"
        >
          + Post New Job
        </Link>
      </div>

      {!orgId ? (
         <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg text-yellow-800">
           You do not appear to be part of an organization. Please contact support or create one.
         </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-gray-900">No jobs posted yet</h3>
          <p className="text-gray-500 mb-6">Get started by creating your first job listing.</p>
          <Link href="/manage-jobs/new" className="text-blue-600 font-medium hover:underline">
            Create a Job &rarr;
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700">Role Title</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Type</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Posted</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{job.role}</td>
                    <td className="px-6 py-4 text-gray-500">{job.type}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        job.stage === 'Open' ? 'bg-green-100 text-green-800' :
                        job.stage === 'Draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {job.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(job.created).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      {/* View Link (Public Job Page) */}
                      <Link 
                        href={`/jobs/${job.id}`} 
                        className="text-gray-500 hover:text-blue-600 font-medium transition-colors"
                        target="_blank"
                      >
                        View
                      </Link>
                      
                      {/* Edit Link (Manage Job Page) */}
                      <Link 
                        href={`/manage-jobs/${job.id}`} 
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
