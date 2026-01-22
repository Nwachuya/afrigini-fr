'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import pb from '@/lib/pocketbase';
import { UserRecord, CandidateProfileRecord, JobRecord } from '@/types';

export default function FindCandidatesPage() {
  // Data State
  const [candidates, setCandidates] = useState<CandidateProfileRecord[]>([]);
  const [myJobs, setMyJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  
  // Filter State
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  
  // User/Org State
  const [orgId, setOrgId] = useState<string | null>(null);

  // Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfileRecord | null>(null);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  
  // Logic to filter dropdown
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [eligibleJobs, setEligibleJobs] = useState<JobRecord[]>([]);

  const PER_PAGE = 10;

  useEffect(() => {
    const init = async () => {
      try {
        const user = pb.authStore.model as unknown as UserRecord;
        
        if (user) {
          try {
            const memberRes = await pb.collection('org_members').getFirstListItem(
              `user = "${user.id}"`,
              { requestKey: null }
            );
            if (memberRes) {
              setOrgId(memberRes.organization);
              
              // Fetch ALL Open Jobs for the Org
              const jobsRes = await pb.collection('jobs').getFullList({
                filter: `organization = "${memberRes.organization}" && stage = "Open"`,
                sort: '-created',
                requestKey: null
              });
              setMyJobs(jobsRes as unknown as JobRecord[]);
            }
          } catch (e) {
            console.log("Not part of an org");
          }
        }
      } catch (err) {
        console.error("Error loading init data:", err);
      }
    };
    init();
  }, []);

  // Fetch Candidates
  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        const constraints = ['is_open_to_work = true'];

        if (searchTerm) {
          constraints.push(`(firstName ~ "${searchTerm}" || lastName ~ "${searchTerm}" || headline ~ "${searchTerm}" || skills ~ "${searchTerm}")`);
        }

        if (locationFilter) {
          constraints.push(`country ~ "${locationFilter}"`);
        }

        const result = await pb.collection('candidate_profiles').getList(page, PER_PAGE, {
          filter: constraints.join(' && '),
          sort: '-created',
          requestKey: null
        });

        setCandidates(result.items as unknown as CandidateProfileRecord[]);
        setTotalItems(result.totalItems);
      } catch (err) {
        console.error("Error fetching candidates:", err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchCandidates();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [page, searchTerm, locationFilter]);

  // When opening modal, calculate eligible jobs
  useEffect(() => {
    const checkEligibility = async () => {
      if (!selectedCandidate || !orgId) return;

      setCheckingEligibility(true);
      setEligibleJobs([]); // Reset
      
      try {
        // 1. Get jobs this candidate has ALREADY applied to
        const existingApps = await pb.collection('job_applications').getFullList({
          filter: `applicant = "${selectedCandidate.id}"`,
          fields: 'job',
          requestKey: null
        });
        const appliedJobIds = existingApps.map((a: any) => a.job);

        // 2. Get jobs this candidate has ALREADY been invited to
        const existingInvites = await pb.collection('job_invitations').getFullList({
          filter: `candidate_profile = "${selectedCandidate.id}"`,
          fields: 'job',
          requestKey: null
        });
        const invitedJobIds = existingInvites.map((i: any) => i.job);

        // 3. Filter myJobs
        const available = myJobs.filter(job => 
          !appliedJobIds.includes(job.id) && !invitedJobIds.includes(job.id)
        );

        setEligibleJobs(available);
        if (available.length > 0) setSelectedJobId(available[0].id);
        else setSelectedJobId('');

      } catch (err) {
        console.error("Error checking eligibility", err);
      } finally {
        setCheckingEligibility(false);
      }
    };

    if (selectedCandidate) {
      checkEligibility();
    }
  }, [selectedCandidate, myJobs, orgId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !selectedJobId || !selectedCandidate) return;

    setSendingInvite(true);
    setInviteError(null);
    
    try {
      await pb.collection('job_invitations').create({
        organization: orgId,
        job: selectedJobId,
        candidate_profile: selectedCandidate.id,
        message: inviteMessage || `We think you'd be a great fit for this role!`,
        status: 'pending'
      });

      setInviteSuccess(`Invitation sent to ${selectedCandidate.firstName}!`);
      setTimeout(() => {
        setInviteSuccess(null);
        setSelectedCandidate(null);
        setInviteMessage('');
        setSelectedJobId('');
      }, 2000);

    } catch (err: any) {
      console.error("Invite failed:", err);
      setInviteError(err.message || "Failed to send invitation.");
    } finally {
      setSendingInvite(false);
    }
  };

  const totalPages = Math.ceil(totalItems / PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-dark">Candidate Directory</h1>
        <p className="text-gray-500 mt-1">Discover talent open to new opportunities.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Search</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Name, Title, Skills..." 
                value={searchTerm}
                onChange={(e) => { setPage(1); setSearchTerm(e.target.value); }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none transition-all"
              />
              <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
            <input 
              type="text" 
              placeholder="e.g. Nigeria, Remote..." 
              value={locationFilter}
              onChange={(e) => { setPage(1); setLocationFilter(e.target.value); }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none transition-all"
            />
          </div>
        </div>

        {/* Candidates Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-20 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green mx-auto mb-4"></div>
              Loading directory...
            </div>
          ) : candidates.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-bold text-brand-dark">No candidates found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {candidates.map((candidate) => {
                const initials = `${candidate.firstName?.[0] || ''}${candidate.lastName?.[0] || ''}`.toUpperCase() || 'U';
                
                let skillTags: string[] = [];
                if (Array.isArray(candidate.skills)) skillTags = candidate.skills;
                else if (typeof candidate.skills === 'string') skillTags = (candidate.skills as string).split(',');

                return (
                  <div key={candidate.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                    {/* Profile Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center text-brand-green font-bold text-xl border border-green-100">
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-bold text-brand-dark text-lg">{candidate.firstName} {candidate.lastName}</h3>
                          <p className="text-sm text-gray-500 line-clamp-1">{candidate.headline || 'No headline'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3 mb-6 flex-grow">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {candidate.country || 'Location not specified'}
                      </div>
                      
                      {/* Skills Chips */}
                      <div className="flex flex-wrap gap-2">
                        {skillTags.slice(0, 4).map((skill, i) => (
                          <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200 font-medium">
                            {skill.trim()}
                          </span>
                        ))}
                        {skillTags.length > 4 && (
                          <span className="px-2 py-1 text-xs text-gray-400">+{skillTags.length - 4}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <button 
                        onClick={() => {
                          if (!orgId) {
                            alert("You must represent an organization to invite candidates.");
                            return;
                          }
                          setSelectedCandidate(candidate);
                        }}
                        className="w-full py-2.5 bg-white border border-brand-green text-brand-green font-bold rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Invite to Apply
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 pt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-white transition-colors text-sm font-medium"
              >
                Previous
              </button>
              <span className="text-gray-600 font-medium text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-white transition-colors text-sm font-medium"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal Overlay */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-gray-100">
            {inviteSuccess ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg className="h-8 w-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-brand-dark">Invitation Sent!</h3>
                <p className="text-gray-500 mt-2">{inviteSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleInvite}>
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="text-lg font-bold text-brand-dark">Invite Candidate</h3>
                  <button 
                    type="button"
                    onClick={() => { setSelectedCandidate(null); setInviteError(null); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-600">
                    You are inviting <strong>{selectedCandidate.firstName} {selectedCandidate.lastName}</strong> to apply.
                  </p>

                  {inviteError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                      {inviteError}
                    </div>
                  )}

                  {checkingEligibility ? (
                    <div className="text-center py-4 text-gray-500 text-sm">Checking eligible jobs...</div>
                  ) : eligibleJobs.length === 0 ? (
                    <div className="bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800 border border-yellow-200">
                      You have no open jobs available for this candidate. They may have already applied or been invited to all your open roles.
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Select Job</label>
                      <select 
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none bg-white"
                      >
                        {eligibleJobs.map(job => (
                          <option key={job.id} value={job.id}>{job.role}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Message (Optional)</label>
                    <textarea 
                      rows={3}
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      placeholder="Hi, we think your profile is impressive..."
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none"
                    ></textarea>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                  <button 
                    type="button"
                    onClick={() => { setSelectedCandidate(null); setInviteError(null); }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={sendingInvite || eligibleJobs.length === 0}
                    className="px-4 py-2 bg-brand-green text-white font-bold rounded-lg hover:bg-green-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {sendingInvite ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
