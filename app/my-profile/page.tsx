'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import pb from '@/lib/pocketbase';
import { UserRecord, CandidateProfileRecord, DepartmentRecord } from '@/types';

export default function MyProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null); // For Resume
  const avatarInputRef = useRef<HTMLInputElement>(null); // For Avatar
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Data
  const [user, setUser] = useState<UserRecord | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [deptOptions, setDeptOptions] = useState<DepartmentRecord[]>([]);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [level, setLevel] = useState('');
  const [gender, setGender] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [skills, setSkills] = useState(''); 
  const [isOpenToWork, setIsOpenToWork] = useState(true);
  const [emailAlert, setEmailAlert] = useState(false);
  const [preferences, setPreferences] = useState<string[]>([]);
  
  // URLs
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!pb.authStore.isValid) {
          router.push('/login');
          return;
        }

        const currentUser = pb.authStore.model as unknown as UserRecord;
        setUser(currentUser);

        // Load Avatar
        if (currentUser.avatar) {
          setAvatarUrl(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${currentUser.id}/${currentUser.avatar}`);
        }

        if (currentUser.role !== 'Applicant') {
          setMessage({ text: 'Only applicants can access this profile page.', type: 'error' });
          setLoading(false);
          return;
        }

        // 1. Fetch Departments
        try {
          const depts = await pb.collection('departments').getFullList({ sort: 'department' });
          setDeptOptions(depts as unknown as DepartmentRecord[]);
        } catch (e) {
          console.error("Failed to load departments");
        }

        // 2. Fetch Existing Profile
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
            setLevel(profile.level || '');
            setGender(profile.gender || '');
            setLinkedin(profile.linkedin || '');
            setPortfolio(profile.portfolio || '');
            setIsOpenToWork(profile.is_open_to_work);
            setEmailAlert(profile.emailAlert);
            
            if (Array.isArray(profile.skills)) {
              setSkills(profile.skills.join(', '));
            } else if (typeof profile.skills === 'string') {
               setSkills(profile.skills);
            }

            if (Array.isArray(profile.preference)) {
              setPreferences(profile.preference);
            }

            if (profile.resume) {
              setResumeUrl(
                `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/candidate_profiles/${profile.id}/${profile.resume}`
              );
            }
          }
        } catch (e) {
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

    loadData();
  }, [router]);

  const togglePreference = (id: string) => {
    setPreferences(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      // 1. Update User Avatar (if changed)
      if (avatarInputRef.current?.files?.length && user) {
        const userFormData = new FormData();
        userFormData.append('avatar', avatarInputRef.current.files[0]);
        const updatedUser = await pb.collection('users').update(user.id, userFormData);
        setAvatarUrl(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${updatedUser.id}/${updatedUser.avatar}?t=${Date.now()}`);
      }

      // 2. Update Candidate Profile
      const formData = new FormData();
      formData.append('user', user!.id);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('headline', headline);
      formData.append('bio', bio);
      formData.append('country', country);
      formData.append('level', level);
      formData.append('gender', gender);
      formData.append('linkedin', linkedin);
      formData.append('portfolio', portfolio);
      formData.append('is_open_to_work', String(isOpenToWork));
      formData.append('emailAlert', String(emailAlert));
      
      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      formData.append('skills', JSON.stringify(skillsArray));
      
      preferences.forEach(p => formData.append('preference', p));

      if (fileInputRef.current?.files?.length) {
        formData.append('resume', fileInputRef.current.files[0]);
      }

      if (profileId) {
        const record = await pb.collection('candidate_profiles').update(profileId, formData);
        if (record.resume) setResumeUrl(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/candidate_profiles/${record.id}/${record.resume}`);
      } else {
        const record = await pb.collection('candidate_profiles').create(formData);
        setProfileId(record.id);
        if (record.resume) setResumeUrl(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/candidate_profiles/${record.id}/${record.resume}`);
      }
      
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      
      // Clear inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (avatarInputRef.current) avatarInputRef.current.value = '';

    } catch (err: any) {
      console.error("Save error:", err);
      setMessage({ text: err.message || 'Failed to save profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">Loading profile...</div>;

  // Styles
  const labelClass = "block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide text-xs";
  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none transition-all bg-white";
  const sectionClass = "bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-8 mb-8";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-dark">My Profile</h1>
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

          <form onSubmit={handleSubmit}>
            
            {/* 1. Personal Details & Avatar */}
            <div className={sectionClass}>
              <h3 className="text-lg font-bold text-brand-dark border-b border-gray-100 pb-3 mb-6">Personal Details</h3>
              
              {/* Avatar Upload */}
              <div className="flex items-center gap-6 mb-8">
                <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl text-gray-400 font-bold">{firstName?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Picture</label>
                  <label className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    Change Photo
                    <input type="file" ref={avatarInputRef} accept="image/*" className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Professional Headline</label>
                  <input type="text" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Bio</label>
                  <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input type="text" value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. Nigeria" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select value={gender} onChange={e => setGender(e.target.value)} className={inputClass}>
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non Binary">Non Binary</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Professional Info */}
            <div className={sectionClass}>
              <h3 className="text-lg font-bold text-brand-dark border-b border-gray-100 pb-3 mb-6">Professional Info</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Seniority Level</label>
                    <input type="text" value={level} onChange={e => setLevel(e.target.value)} placeholder="e.g. Senior / Mid-Level" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Skills (Comma separated)</label>
                    <input type="text" value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, Node.js, Design" className={inputClass} />
                  </div>
                </div>
                
                <div>
                  <label className={labelClass}>Department Preferences</label>
                  <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 max-h-48 overflow-y-auto grid grid-cols-2 gap-2">
                    {deptOptions.map(dept => (
                      <label key={dept.id} className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={preferences.includes(dept.id)}
                          onChange={() => togglePreference(dept.id)}
                          className="w-4 h-4 text-brand-green rounded focus:ring-brand-green border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{dept.department}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Links & Resume */}
            <div className={sectionClass}>
              <h3 className="text-lg font-bold text-brand-dark border-b border-gray-100 pb-3 mb-6">Links & Resume</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className={labelClass}>LinkedIn URL</label>
                  <input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Portfolio URL</label>
                  <input type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                {resumeUrl ? (
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3 text-sm text-gray-700">
                      <span className="font-bold text-brand-green">✓ Current Resume</span>
                    </div>
                    <a href={resumeUrl} target="_blank" className="text-brand-green hover:underline text-sm font-bold">View</a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-4">No resume uploaded yet.</p>
                )}
                <label className={labelClass}>Upload New Resume (PDF)</label>
                <input type="file" ref={fileInputRef} accept=".pdf,.doc,.docx" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-green-50 file:text-brand-green hover:file:bg-green-100 cursor-pointer" />
              </div>
            </div>

            {/* 4. Settings */}
            <div className={sectionClass}>
              <h3 className="text-lg font-bold text-brand-dark border-b border-gray-100 pb-3 mb-6">Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="openToWork" checked={isOpenToWork} onChange={e => setIsOpenToWork(e.target.checked)} className="w-5 h-5 text-brand-green border-gray-300 rounded focus:ring-brand-green" />
                  <label htmlFor="openToWork" className="text-sm font-medium text-gray-700 cursor-pointer">I am currently open to work</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="emailAlert" checked={emailAlert} onChange={e => setEmailAlert(e.target.checked)} className="w-5 h-5 text-brand-green border-gray-300 rounded focus:ring-brand-green" />
                  <label htmlFor="emailAlert" className="text-sm font-medium text-gray-700 cursor-pointer">Receive email alerts for new jobs</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pb-12">
              <button type="submit" disabled={saving} className="px-10 py-4 bg-brand-green text-white font-bold rounded-xl hover:bg-green-800 transition-all shadow-lg disabled:opacity-70">
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-6">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Live Preview</h3>
            <div className="text-center">
              <div className="h-24 w-24 rounded-full bg-green-50 mx-auto flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-brand-green">{firstName ? firstName[0].toUpperCase() : 'U'}</span>
                )}
              </div>
              <h2 className="mt-4 text-xl font-bold text-brand-dark">{firstName} {lastName}</h2>
              <p className="text-sm text-gray-500">{headline || 'Professional Headline'}</p>
              
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {skills.split(',').slice(0, 3).map((s, i) => s.trim() && (
                  <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">{s.trim()}</span>
                ))}
              </div>

              {isOpenToWork && (
                <div className="mt-6 inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-brand-green text-xs font-bold border border-green-200">
                  <span className="w-2 h-2 bg-brand-green rounded-full mr-2 animate-pulse"></span>
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
