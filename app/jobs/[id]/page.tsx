'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import pb from '@/lib/pocketbase';
import { JobRecord, UserRecord, CandidateProfileRecord } from '@/types';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [job, setJob] = useState<JobRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [user, setUser] = useState<UserRecord | null>(null);
  const [profile, setProfile] = useState<CandidateProfileRecord | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = pb.authStore.model as unknown as UserRecord;
        setUser(currentUser);

        // 1. Fetch Job Details
        const jobRes = await pb.collection('jobs').getOne(id, {
          expand: 'organization,department',
        });
        setJob(jobRes as unknown as JobRecord);

        if (currentUser) {
          // 2. Check if user has a profile and has already applied
          try {
            const profileRes = await pb.collection('candidate_profiles').getFirstListItem(
              `user = "${currentUser.id}"`
            );
            setProfile(profileRes as unknown as CandidateProfileRecord);

            if (profileRes) {
              const applications = await pb.collection('job_applications').getList(1, 1, {
                filter: `job = "${id}" && applicant = "${profileRes.id}"`,
              });
              if (applications.totalItems > 0) setHasApplied(true);
            }
          } catch (e) {
            // User is likely a Company or hasn't created a profile yet
          }
        }
      } catch (err) {
        console.error("Error loading job:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleApply = async () => {
    if (!user) {
      router.push('/login?redirect=/jobs/' + id);
      return;
    }
    
    if (user.role !== 'Applicant') {
      setError("Company accounts cannot apply to jobs.");
      return;
    }

    if (!profile) {
      setError("Please create your candidate profile in the Dashboard before applying.");
      return;
    }

    setApplying(true);
    setError('');

    try {
      await pb.collection('job_applications').create({
        job: id,
        applicant: profile.id,
        stage: 'Applied',
      });
      setHasApplied(true);
    } catch (err: any) {
      console.error("Apply error:", err);
      setError(err.message || "Failed to submit application.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-gray-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
        Loading job details...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Job not found</h2>
        <p className="text-gray-500 mt-2">This job posting may have been removed or expired.</p>
        <Link href="/jobs" className="text-blue-600 hover:underline mt-4 inline-block">
          &larr; Back to Jobs
        </Link>
      </div>
    );
  }

  const org = job.expand?.organization;
  const logoUrl = org?.logo 
    ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/organizations/${org.id}/${org.logo}`
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <div className="mb-6">
        <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-900 font-medium flex items-center group">
          <svg className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Jobs
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Job Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Header Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="h-20 w-20 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-100 overflow-hidden text-gray-400">
                {logoUrl ? (
                  <img src={logoUrl} alt={org?.name} className="h-full w-full object-contain" />
                ) : (
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )}
              </div>
              <div className="flex-grow">
                <h1 className="text-3xl font-bold text-gray-900 leading-tight">{job.role}</h1>
                <p className="text-lg text-gray-600 font-medium mt-1">{org?.name}</p>
                
                <div className="flex flex-wrap gap-3 mt-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {job.type}
                  </span>
                  {job.salary > 0 && (
                    <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100">
                      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {job.currency} {job.salary.toLocaleString()} / {job.paymentType}
                    </span>
                  )}
                  {job.expand?.department?.map((dept: any) => (
                     <span key={dept.id} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
                       <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                       </svg>
                       {dept.department}
                     </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Description & Benefits */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-8">
            {job.description && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">About the Role</h2>
                <div 
                  className="prose max-w-none text-gray-600 leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>p]:mb-4"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              </section>
            )}

            {job.benefits && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Benefits & Perks</h2>
                <div 
                  className="prose max-w-none text-gray-600 leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>p]:mb-4"
                  dangerouslySetInnerHTML={{ __html: job.benefits }}
                />
              </section>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Interested in this role?</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {user?.role === 'Company' ? (
              <div className="p-4 bg-gray-50 text-gray-600 text-center rounded-lg text-sm border border-gray-100">
                <div className="mb-2 text-2xl">🏢</div>
                You are logged in as a <strong>Company</strong>. 
                <br/>
                Please use an Applicant account to apply.
              </div>
            ) : hasApplied ? (
              <div className="w-full py-4 bg-green-50 text-green-700 font-bold rounded-lg border border-green-200 flex flex-col items-center justify-center text-center">
                <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Application Sent!</span>
                <span className="text-xs font-normal mt-1 text-green-600">Good luck!</span>
              </div>
            ) : (
              <button 
                onClick={handleApply}
                disabled={applying}
                className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {applying ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Apply Now'
                )}
              </button>
            )}

            {hasApplied && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <Link href="/dashboard/applicant" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Track your application status &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
