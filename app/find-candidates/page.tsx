'use client';

import { useEffect, useState } from 'react';
import pb from '@/lib/pocketbase';
import { UserRecord } from '@/types';

interface ExpandedApplication {
  id: string;
  stage: string;
  created: string;
  expand: {
    applicant: {
      firstName: string;
      lastName: string;
      headline: string;
      avatar: string;
    };
    job: {
      role: string;
    };
  };
}

export default function FindCandidatesPage() {
  const [applications, setApplications] = useState<ExpandedApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const user = pb.authStore.model as unknown as UserRecord;
        if (!user) return;

        const memberRes = await pb.collection('org_members').getFirstListItem(
          `user = "${user.id}"`
        );
        
        if (memberRes && memberRes.organization) {
          const appsRes = await pb.collection('job_applications').getList(1, 50, {
            filter: `job.organization = "${memberRes.organization}"`,
            expand: 'applicant,job',
            sort: '-created',
          });
          setApplications(appsRes.items as unknown as ExpandedApplication[]);
        }
      } catch (err) {
        console.error("Error loading candidates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  if (loading) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500">Loading candidates...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Find Candidates</h1>
          <p className="text-gray-500">Review active applications across all your jobs.</p>
        </div>
        <div className="mt-4 md:mt-0 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search by name..." 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
          />
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900">No candidates yet</h3>
          <p className="text-gray-500">Wait for applicants to apply to your posted jobs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => {
            const profile = app.expand?.applicant;
            const job = app.expand?.job;
            const name = profile ? `${profile.firstName} ${profile.lastName}` : 'Unknown Candidate';
            const initials = name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
            
            return (
              <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{name}</h3>
                      <p className="text-sm text-gray-500">{profile?.headline || 'No headline'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Applied for:</span>
                     <span className="font-medium text-gray-900">{job?.role || 'Unknown Job'}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Date:</span>
                     <span>{new Date(app.created).toLocaleDateString()}</span>
                   </div>
                   <div className="flex justify-between text-sm items-center">
                     <span className="text-gray-500">Stage:</span>
                     <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                       {app.stage}
                     </span>
                   </div>
                </div>

                <div className="mt-6">
                  <button className="w-full py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    View Application
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
