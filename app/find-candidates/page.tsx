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
  const [searchTerm, setSearchTerm] = useState('');
  
  // User/Org State
  const [orgId, setOrgId] = useState<string | null>(null);

  // Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfileRecord | null>(null);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null); // Stores success message

  useEffect(() => {
    const init = async () => {
      try {
        const user = pb.authStore.model as unknown as UserRecord;
        
        // 1. Get User's Org (to know who is sending the invite)
        if (user) {
          try {
            const memberRes = await pb.collection('org_members').getFirstListItem(
              `user = "${user.id}"`
            );
            if (memberRes) {
              setOrgId(memberRes.organization);
              
              // 2. Fetch My Open Jobs (for the dropdown)
              const jobsRes = await pb.collection('jobs').getFullList({
                filter: `organization = "${memberRes.organization}" && stage = "Open"`,
                sort: '-created',
              });
              setMyJobs(jobsRes as unknown as JobRecord[]);
            }
          } catch (e) {
            console.log("Not part of an org or error fetching org details");
          }
        }

        // 3. Fetch Candidates (Open to Work)
        // Note: The schema viewRule ensures we only see open_to_work profiles if we are not Applicants
        const candidatesRes = await pb.collection('candidate_profiles').getList(1, 50, {
          filter: 'is_open_to_work = true',
          sort: '-created',
        });
        setCandidates(candidatesRes.items as unknown as CandidateProfileRecord[]);

      } catch (err) {
        console.error("Error loading page data:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !selectedJobId || !selectedCandidate) return;

    setSendingInvite(true);
    
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
        setSelectedCandidate(null); // Close modal
        setInviteMessage('');
        setSelectedJobId('');
      }, 2000);

    } catch (err: any) {
      console.error("Invite failed:", err);
      alert("Failed to send invitation: " + err.message);
    } finally {
      setSendingInvite(false);
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    const skills = Array.isArray(c.skills) ? c.skills.join(' ').toLowerCase() : '';
    const headline = (c.headline || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return fullName.includes(term) || skills.includes(term) || headline.includes(term);
  });

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">Loading directory...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Candidate Directory</h1>
          <p className="text-gray-500 mt-1">Discover talent open to new opportunities.</p>
        </div>
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="Search by name, skills, or title..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-shadow"
          />
          <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Candidates Grid */}
      {filteredCandidates.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900">No candidates found</h3>
          <p className="text-gray-500">Try adjusting your search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map((candidate) => {
            const initials = `${candidate.firstName?.[0] || ''}${candidate.lastName?.[0] || ''}`.toUpperCase() || 'U';
            
            // Skills processing
            let skillTags: string[] = [];
            if (Array.isArray(candidate.skills)) skillTags = candidate.skills;
            else if (typeof candidate.skills === 'string') skillTags = (candidate.skills as string).split(',');

            return (
              <div key={candidate.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                {/* Profile Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{candidate.firstName} {candidate.lastName}</h3>
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
                      <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200">
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
                      if (myJobs.length === 0) {
                        alert("You have no open jobs to invite this candidate to.");
                        return;
                      }
                      setSelectedCandidate(candidate);
                      // Default to first job
                      if (myJobs.length > 0) setSelectedJobId(myJobs[0].id);
                    }}
                    className="w-full py-2.5 bg-white border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
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

      {/* Invite Modal Overlay */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            {inviteSuccess ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Invitation Sent!</h3>
                <p className="text-sm text-gray-500 mt-2">{inviteSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleInvite}>
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Invite Candidate</h3>
                  <button 
                    type="button"
                    onClick={() => setSelectedCandidate(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-600">
                    You are inviting <strong>{selectedCandidate.firstName} {selectedCandidate.lastName}</strong> to apply.
                  </p>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Job</label>
                    <select 
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {myJobs.map(job => (
                        <option key={job.id} value={job.id}>{job.role}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message (Optional)</label>
                    <textarea 
                      rows={3}
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      placeholder="Hi, we think your profile is impressive..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    ></textarea>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                  <button 
                    type="button"
                    onClick={() => setSelectedCandidate(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={sendingInvite}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
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
