'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import pb from '@/lib/pocketbase';
import { UserRecord, CandidateProfileRecord } from '@/types';

export default function MyProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // type: 'success' | 'error'
  
  // User & Profile Data
  const [user, setUser] = useState<UserRecord | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [skills, setSkills] = useState(''); // Comma separated string for UI
  const [isOpenToWork, setIsOpenToWork] = useState(true);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!pb.authStore.isValid) {
          router.push('/login');
          return;
        }

        const currentUser = pb.authStore.model as unknown as UserRecord;
        setUser(currentUser);

        if (currentUser.role !== 'Applicant') {
          setMessage({ text: 'Only applicants can access this profile page.', type: 'error' });
          setLoading(false);
          return;
        }

        // Fetch existing profile
        try {
          const profile = await pb.collection('candidate_profiles').getFirstListItem(
            `user = "${currentUser.id}"`
          );
          
          if (profile) {
            setProfileId(profile.id);
            setFirstName(profile.firstName || '');
            setLastName(profile.lastName || '');
            setHeadline(profile.headline || '');
            setBio(profile.bio || '');
            setCountry(profile.country || '');
            setLinkedin(profile.linkedin || '');
            setPortfolio(profile.portfolio || '');
            setIsOpenToWork(profile.is_open_to_work);
            
            // Handle skills (stored as JSON/Array, convert to CSV for input)
            if (Array.isArray(profile.skills)) {
              setSkills(profile.skills.join(', '));
            } else if (typeof profile.skills === 'string') {
               setSkills(profile.skills);
            }

            // Handle Resume URL
            if (profile.resume) {
              setResumeUrl(
                `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/candidate_profiles/${profile.id}/${profile.resume}`
              );
            }
          }
        } catch (e) {
          // No profile found, we will create one on save
          console.log("No existing profile found, creating fresh.");
          // Pre-fill name from auth record if available
          if (currentUser.name) {
            const parts = currentUser.name.split(' ');
            if (parts.length > 0) setFirstName(parts[0]);
            if (parts.length > 1) setLastName(parts.slice(1).join(' '));
          }
        }

      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const formData = new FormData();
      formData.append('user', user!.id);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('headline', headline);
      formData.append('bio', bio);
      formData.append('country', country);
      formData.append('linkedin', linkedin);
      formData.append('portfolio', portfolio);
      formData.append('is_open_to_work', String(isOpenToWork));
      
      // Convert CSV skills string to JSON array
      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      formData.append('skills', JSON.stringify(skillsArray));

      // Check for file
      if (fileInputRef.current?.files?.length) {
        formData.append('resume', fileInputRef.current.files[0]);
      }

      if (profileId) {
        // Update
        const record = await pb.collection('candidate_profiles').update(profileId, formData);
        // Update local resume URL if a new file was uploaded
        if (record.resume) {
           setResumeUrl(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/candidate_profiles/${record.id}/${record.resume}`);
        }
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
      } else {
        // Create
        const record = await pb.collection('candidate_profiles').create(formData);
        setProfileId(record.id);
        if (record.resume) {
           setResumeUrl(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/candidate_profiles/${record.id}/${record.resume}`);
        }
        setMessage({ text: 'Profile created successfully!', type: 'success' });
      }
      
      // Clear file input
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err: any) {
      console.error("Save error:", err);
      setMessage({ text: err.message || 'Failed to save profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">Loading profile...</div>;
  }

  // Styling Helpers
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";
  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your professional information and resume.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Form */}
        <div className="lg:col-span-2">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              
              {/* Personal Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <input 
                      type="text" 
                      required
                      value={firstName} 
                      onChange={e => setFirstName(e.target.value)} 
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input 
                      type="text" 
                      required
                      value={lastName} 
                      onChange={e => setLastName(e.target.value)} 
                      className={inputClass} 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Professional Headline</label>
                    <input 
                      type="text" 
                      value={headline} 
                      onChange={e => setHeadline(e.target.value)} 
                      placeholder="e.g. Senior Frontend Engineer | React Specialist"
                      className={inputClass} 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Bio</label>
                    <textarea 
                      rows={4}
                      value={bio} 
                      onChange={e => setBio(e.target.value)} 
                      placeholder="Tell us a bit about yourself..."
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Country / Location</label>
                    <input 
                      type="text" 
                      value={country} 
                      onChange={e => setCountry(e.target.value)} 
                      placeholder="e.g. Canada"
                      className={inputClass} 
                    />
                  </div>
                </div>
              </div>

              {/* Skills & Socials */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">Skills & Links</h3>
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>Skills (Comma separated)</label>
                    <input 
                      type="text" 
                      value={skills} 
                      onChange={e => setSkills(e.target.value)} 
                      placeholder="React, TypeScript, Next.js, Tailwind CSS"
                      className={inputClass} 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>LinkedIn URL</label>
                      <input 
                        type="url" 
                        value={linkedin} 
                        onChange={e => setLinkedin(e.target.value)} 
                        placeholder="https://linkedin.com/in/..."
                        className={inputClass} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Portfolio URL</label>
                      <input 
                        type="url" 
                        value={portfolio} 
                        onChange={e => setPortfolio(e.target.value)} 
                        placeholder="https://mywebsite.com"
                        className={inputClass} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Resume Upload */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">Resume</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  {resumeUrl ? (
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 text-sm text-gray-700">
                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Current Resume Uploaded</span>
                      </div>
                      <a 
                        href={resumeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                      >
                        View/Download
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">No resume uploaded yet.</p>
                  )}
                  
                  <label className={labelClass}>Upload New Resume (PDF/Docx)</label>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept=".pdf,.doc,.docx"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  id="openToWork"
                  checked={isOpenToWork}
                  onChange={e => setIsOpenToWork(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="openToWork" className="text-sm font-medium text-gray-700 cursor-pointer">
                  I am currently open to work and new opportunities
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 flex justify-end">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-70 flex items-center"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Preview Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-6">
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">Preview</h3>
            <div className="text-center">
              <div className="h-24 w-24 rounded-full bg-blue-100 mx-auto flex items-center justify-center text-3xl font-bold text-blue-600 border-4 border-white shadow-sm">
                {firstName ? firstName[0].toUpperCase() : 'U'}
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-900">{firstName} {lastName}</h2>
              <p className="text-sm text-gray-500">{headline || 'Professional Headline'}</p>
              
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {skills.split(',').slice(0, 3).map((s, i) => s.trim() && (
                  <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{s.trim()}</span>
                ))}
                {skills.split(',').length > 3 && (
                  <span className="px-2 py-1 bg-gray-50 text-gray-400 text-xs rounded-full">+{skills.split(',').length - 3} more</span>
                )}
              </div>

              {isOpenToWork && (
                <div className="mt-6 inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Open to Work
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
