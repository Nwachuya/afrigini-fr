'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import pb from '@/lib/pocketbase';
import { UserRecord } from '@/types';

// Helper interface for the expanded response
interface ApplicationRecord {
  id: string;
  stage: string;
  created: string;
  expand: {
    job: {
      role: string;
      id: string;
    };
    applicant: {
      firstName: string;
      lastName: string;
      headline: string;
      id: string;
    };
  };
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState('All');

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const user = pb.authStore.model as unknown as UserRecord;
        if (!user) return;

        // 1. Get Org
        const memberRes = await pb.collection('org_members').getFirstListItem(
          `user = "${user.id}"`
        );

        if (memberRes && memberRes.organization) {
          // 2. Fetch all applications for jobs in this org
          const result = await pb.collection('job_applications').getList(1, 100, {
            filter: `job.organization = "${memberRes.organization}"`,
            sort: '-created',
            expand: 'job,applicant',
          });
          setApplications(result.items as unknown as ApplicationRecord[]);
        }
      } catch (err) {
        console.error("Error fetching applications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, []);

  const filteredApps = filterStage === 'All' 
    ? applications 
    : applications.filter(app => app.stage === filterStage);

  const getStatusColor = (stage: string) => {
    switch (stage) {
      case 'Applied': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Interview': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Rejected': return 'bg-red-50 text-red-700 border-red-100';
      case 'Accepted': return 'bg-green-50 text-green-700 border-green-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">Loading applications...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500 mt-1">Manage and track candidates for your open roles.</p>
        </div>
        
        {/* Stage Filter */}
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
          {['All', 'Applied', 'Interview', 'Accepted'].map((stage) => (
            <button
              key={stage}
              onClick={() => setFilterStage(stage)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                filterStage === stage 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {filteredApps.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-4xl mb-3">📂</div>
            <p>No applications found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700">Candidate</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Applied For</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Applied Date</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Stage</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApps.map((app) => {
                  const applicant = app.expand?.applicant;
                  const job = app.expand?.job;
                  const fullName = applicant ? `${applicant.firstName} ${applicant.lastName}` : 'Unknown User';
                  
                  return (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{fullName}</div>
                        <div className="text-xs text-gray-500">{applicant?.headline || 'No headline'}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {job?.role || 'Unknown Job'}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(app.created).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(app.stage)}`}>
                          {app.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* LINKED CORRECTLY TO THE ACTION PAGE */}
                        <Link 
                          href={`/applications/${app.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
