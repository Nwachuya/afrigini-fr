'use client';

import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import pb from '@/lib/pocketbase';
import { UserRecord, CandidateProfileRecord, DepartmentRecord } from '@/types';
import {
  User,
  Briefcase,
  Link as LinkIcon,
  Settings,
  MapPin,
  Linkedin,
  Globe,
  FileText,
  X,
  Plus,
  CheckCircle2,
  Circle,
  Camera,
  Upload,
  ImagePlus,
} from 'lucide-react';

const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon',
  'Cape Verde', 'Central African Republic', 'Chad', 'Comoros', 'Congo', 'DR Congo',
  'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia',
  'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Ivory Coast', 'Kenya',
  'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania',
  'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda',
  'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia',
  'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda',
  'Zambia', 'Zimbabwe'
];

const SENIORITY_LEVELS = [
  'Intern',
  'Entry Level',
  'Junior',
  'Mid-Level',
  'Senior',
  'Lead',
  'Manager',
  'Director',
  'Executive',
];

export default function MyProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headshotInputRef = useRef<HTMLInputElement>(null);
  const skillInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [user, setUser] = useState<UserRecord | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [deptOptions, setDeptOptions] = useState<DepartmentRecord[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [level, setLevel] = useState('');
  const [gender, setGender] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [skillsArray, setSkillsArray] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [isOpenToWork, setIsOpenToWork] = useState(true);
  const [emailAlert, setEmailAlert] = useState(false);
  const [preferences, setPreferences] = useState<string[]>([]);
  
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null);
  
  // New file states
  const [pendingHeadshot, setPendingHeadshot] = useState<File | null>(null);
  const [pendingHeadshotPreview, setPendingHeadshotPreview] = useState<string | null>(null);
  const [pendingResume, setPendingResume] = useState<File | null>(null);

  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const filteredCountries = AFRICAN_COUNTRIES.filter(c => 
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const calculateCompleteness = () => {
    const fields = [
      firstName,
      lastName,
      headline,
      bio,
      country,
      level,
      gender,
      linkedin || portfolio,
      skillsArray.length > 0,
      resumeUrl || pendingResume,
      headshotUrl || pendingHeadshot,
      preferences.length > 0,
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completeness = calculateCompleteness();

  useEffect(() => {
    const loadData = async () => {
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

        try {
          const depts = await pb.collection('departments').getFullList({ sort: 'department' });
          setDeptOptions(depts as unknown as DepartmentRecord[]);
        } catch (e) {
          console.error("Failed to load departments");
        }

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
            setCountrySearch(profile.country || '');
            setLevel(profile.level || '');
            setGender(profile.gender || '');
            setLinkedin(profile.linkedin || '');
            setPortfolio(profile.portfolio || '');
            setIsOpenToWork(profile.is_open_to_work);
            setEmailAlert(profile.emailAlert);
            
            if (Array.isArray(profile.skills)) {
              setSkillsArray(profile.skills);
            } else if (typeof profile.skills === 'string') {
              setSkillsArray(profile.skills.split(',').map((s: string) => s.trim()).filter(Boolean));
            }

            if (Array.isArray(profile.preference)) {
              setPreferences(profile.preference);
            }

            if (profile.resume) {
              setResumeUrl(
                `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/candidate_profiles/${profile.id}/${profile.resume}`
              );
              setResumeFileName(profile.resume);
            }

            if (profile.headshot) {
              setHeadshotUrl(
                `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/candidate_profiles/${profile.id}/${profile.headshot}`
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

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !skillsArray.includes(skill)) {
      setSkillsArray([...skillsArray, skill]);
      setSkillInput('');
      skillInputRef.current?.focus();
    }
  };

  const removeSkill = (skill: string) => {
    setSkillsArray(skillsArray.filter(s => s !== skill));
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const selectCountry = (c: string) => {
    setCountry(c);
    setCountrySearch(c);
    setShowCountryDropdown(false);
  };

  const handleHeadshotChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingHeadshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingHeadshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingResume(file);
    }
  };

  const clearPendingHeadshot = () => {
    setPendingHeadshot(null);
    setPendingHeadshotPreview(null);
    if (headshotInputRef.current) {
      headshotInputRef.current.value = '';
    }
  };

  const clearPendingResume = () => {
    setPendingResume(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
      formData.append('level', level);
      formData.append('gender', gender);
      formData.append('linkedin', linkedin);
      formData.append('portfolio', portfolio);
      formData.append('is_open_to_work', String(isOpenToWork));
      formData.append('emailAlert', String(emailAlert));
      
      formData.append('skills', JSON.stringify(skillsArray));
      
      preferences.forEach(p => formData.append('preference', p));

      if (pendingResume) {
        formData.append('resume', pendingResume);
      }

      if (pendingHeadshot) {
        formData.append('headshot', pendingHeadshot);
      }

      let record;
      if (profileId) {
        record = await pb.collection('candidate_profiles').update(profileId, formData);
      } else {
        record = await pb.collection('candidate_profiles').create(formData);
        setProfileId(record.id);
      }

      if (record.resume) {
        setResumeUrl(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/candidate_profiles/${record.id}/${record.resume}`);
        setResumeFileName(record.resume);
      }

      if (record.headshot) {
        setHeadshotUrl(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/candidate_profiles/${record.id}/${record.headshot}?t=${Date.now()}`);
      }
      
      // Clear pending files
      setPendingHeadshot(null);
      setPendingHeadshotPreview(null);
      setPendingResume(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (headshotInputRef.current) headshotInputRef.current.value = '';
      
      setMessage({ text: 'Profile updated successfully!', type: 'success' });

    } catch (err: any) {
      console.error("Save error:", err);
      setMessage({ text: err.message || 'Failed to save profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all bg-white text-sm";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2";

  // Display image: pending preview > saved headshot > placeholder
  const displayImage = pendingHeadshotPreview || headshotUrl;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">My Profile</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage your professional information and resume.</p>
        </div>

        {/* Profile Completeness */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              {completeness === 100 ? (
                <CheckCircle2 size={20} className="text-brand-green" />
              ) : (
                <Circle size={20} className="text-gray-300" />
              )}
              <span className="font-semibold text-brand-dark">Profile Completeness</span>
            </div>
            <span className={`text-sm font-bold ${completeness === 100 ? 'text-brand-green' : 'text-amber-500'}`}>
              {completeness}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${completeness === 100 ? 'bg-brand-green' : 'bg-amber-400'}`}
              style={{ width: `${completeness}%` }}
            />
          </div>
          {completeness < 100 && (
            <p className="text-xs text-gray-500 mt-2">Complete your profile to increase visibility to recruiters.</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 1. Personal Details */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="p-2 bg-brand-green/10 rounded-lg">
                    <User size={18} className="text-brand-green" />
                  </div>
                  <h3 className="font-semibold text-brand-dark">Personal Details</h3>
                </div>
                
                <div className="p-4 sm:p-6">
                  {/* Headshot Upload */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 pb-6 border-b border-gray-100">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200 overflow-hidden">
                        {displayImage ? (
                          <img src={displayImage} alt="Headshot" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-3xl text-gray-400 font-bold">{firstName?.[0]?.toUpperCase() || 'U'}</span>
                        )}
                      </div>
                      {pendingHeadshotPreview && (
                        <button
                          type="button"
                          onClick={clearPendingHeadshot}
                          className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="font-medium text-brand-dark">Professional Headshot</p>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG or WebP. Max 5MB.</p>
                      
                      {pendingHeadshotPreview ? (
                        <span className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg">
                          <ImagePlus size={14} />
                          New photo selected - Save to upload
                        </span>
                      ) : (
                        <label className="inline-block mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                          {headshotUrl ? 'Change Photo' : 'Upload Photo'}
                          <input 
                            type="file" 
                            ref={headshotInputRef} 
                            accept="image/png,image/jpeg,image/webp,image/avif,image/heic" 
                            onChange={handleHeadshotChange}
                            className="hidden" 
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>First Name *</label>
                      <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} placeholder="John" />
                    </div>
                    <div>
                      <label className={labelClass}>Last Name *</label>
                      <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} placeholder="Doe" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Professional Headline</label>
                      <input type="text" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Bio</label>
                      <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." className={inputClass} />
                    </div>
                    <div className="relative">
                      <label className={labelClass}>Country</label>
                      <input 
                        type="text" 
                        value={countrySearch} 
                        onChange={e => {
                          setCountrySearch(e.target.value);
                          setShowCountryDropdown(true);
                        }}
                        onFocus={() => setShowCountryDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCountryDropdown(false), 200)}
                        placeholder="Search country..."
                        className={inputClass}
                      />
                      {showCountryDropdown && filteredCountries.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredCountries.map(c => (
                            <button
                              key={c}
                              type="button"
                              onMouseDown={() => selectCountry(c)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      )}
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
              </div>

              {/* 2. Professional Info */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="p-2 bg-brand-green/10 rounded-lg">
                    <Briefcase size={18} className="text-brand-green" />
                  </div>
                  <h3 className="font-semibold text-brand-dark">Professional Info</h3>
                </div>
                
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Seniority Level</label>
                      <select value={level} onChange={e => setLevel(e.target.value)} className={inputClass}>
                        <option value="">Select level...</option>
                        {SENIORITY_LEVELS.map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Skills</label>
                      <div className="flex gap-2">
                        <input 
                          ref={skillInputRef}
                          type="text" 
                          value={skillInput} 
                          onChange={e => setSkillInput(e.target.value)}
                          onKeyDown={handleSkillKeyDown}
                          placeholder="Add a skill..."
                          className={inputClass}
                        />
                        <button 
                          type="button" 
                          onClick={addSkill}
                          className="px-3 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-green/90 transition-colors"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Skills Tags */}
                  {skillsArray.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skillsArray.map((skill, i) => (
                        <span 
                          key={i} 
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-green/10 text-brand-green text-sm font-medium rounded-full"
                        >
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors">
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div>
                    <label className={labelClass}>Department Preferences</label>
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {deptOptions.map(dept => (
                        <label key={dept.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1.5 rounded transition-colors">
                          <input 
                            type="checkbox" 
                            checked={preferences.includes(dept.id)}
                            onChange={() => togglePreference(dept.id)}
                            className="w-4 h-4 rounded border-gray-300 focus:ring-brand-green"
                            style={{ accentColor: '#00684A' }}
                          />
                          <span className="text-sm text-gray-700">{dept.department}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Links & Resume */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="p-2 bg-brand-green/10 rounded-lg">
                    <LinkIcon size={18} className="text-brand-green" />
                  </div>
                  <h3 className="font-semibold text-brand-dark">Links & Resume</h3>
                </div>
                
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>LinkedIn URL</label>
                      <div className="relative">
                        <Linkedin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className={`${inputClass} pl-10`} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Portfolio URL</label>
                      <div className="relative">
                        <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)} placeholder="https://yoursite.com" className={`${inputClass} pl-10`} />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-gray-200">
                          <FileText size={18} className="text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-brand-dark text-sm">Resume</p>
                          <p className="text-xs text-gray-500">PDF, DOC or DOCX</p>
                        </div>
                      </div>
                      {resumeUrl && !pendingResume && (
                        <a href={resumeUrl} target="_blank" className="text-brand-green hover:underline text-sm font-semibold">
                          View Current
                        </a>
                      )}
                    </div>
                    
                    {pendingResume ? (
                      <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-amber-600" />
                          <span className="text-sm text-amber-700 font-medium">{pendingResume.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={clearPendingResume}
                          className="p-1 text-amber-600 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-green hover:bg-brand-green/5 transition-colors">
                        <Upload size={18} className="text-gray-400" />
                        <span className="text-sm text-gray-600">Click to upload new resume</span>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          accept=".pdf,.doc,.docx" 
                          onChange={handleResumeChange}
                          className="hidden" 
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Settings */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="p-2 bg-brand-green/10 rounded-lg">
                    <Settings size={18} className="text-brand-green" />
                  </div>
                  <h3 className="font-semibold text-brand-dark">Settings</h3>
                </div>
                
                <div className="p-4 sm:p-6 space-y-4">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={isOpenToWork} 
                      onChange={e => setIsOpenToWork(e.target.checked)} 
                      className="w-5 h-5 rounded border-gray-300 focus:ring-brand-green"
                      style={{ accentColor: '#00684A' }}
                    />
                    <div>
                      <p className="font-medium text-brand-dark text-sm">Open to Work</p>
                      <p className="text-xs text-gray-500">Let recruiters know you're available</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={emailAlert} 
                      onChange={e => setEmailAlert(e.target.checked)} 
                      className="w-5 h-5 rounded border-gray-300 focus:ring-brand-green"
                      style={{ accentColor: '#00684A' }}
                    />
                    <div>
                      <p className="font-medium text-brand-dark text-sm">Email Alerts</p>
                      <p className="text-xs text-gray-500">Receive notifications for new jobs</p>
                    </div>
                  </label>
                </div>
              </div>

          {/* Submit Button + Message */}
          <div className="space-y-3">
            {message.text && (
              <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.text}
              </div>
            )}
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={saving} 
                className="w-full sm:w-auto px-8 py-3 bg-brand-green text-white font-semibold rounded-xl hover:bg-brand-green/90 transition-all shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </div>

            </form>
          </div>

          {/* RIGHT COLUMN: Preview */}
<div className="lg:col-span-1">
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm sticky top-6 overflow-hidden">
    <div className="px-4 py-3 bg-brand-green">
      <p className="text-xs font-semibold text-white uppercase tracking-wider">Live Preview</p>
    </div>
              
              <div className="p-6">
                {/* Headshot */}
                <div className="flex justify-center mb-4">
                  <div className="h-20 w-20 rounded-full bg-brand-green/10 flex items-center justify-center border-2 border-white shadow-md overflow-hidden">
                    {displayImage ? (
                      <img src={displayImage} alt="Headshot" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-brand-green">{firstName ? firstName[0].toUpperCase() : 'U'}</span>
                    )}
                  </div>
                </div>
                
                {/* Name & Headline */}
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-brand-dark">
                    {firstName || 'First'} {lastName || 'Last'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{headline || 'Your headline'}</p>
                </div>
                
                {/* Badges */}
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {country && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      <MapPin size={12} />
                      {country}
                    </span>
                  )}
                  {level && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                      {level}
                    </span>
                  )}
                </div>
                
                {/* Skills */}
                {skillsArray.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                    {skillsArray.slice(0, 5).map((s, i) => (
                      <span key={i} className="px-2 py-1 bg-brand-green/10 text-brand-green text-xs rounded-full font-medium">
                        {s}
                      </span>
                    ))}
                    {skillsArray.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                        +{skillsArray.length - 5} more
                      </span>
                    )}
                  </div>
                )}
                
                {/* Links */}
                {(linkedin || portfolio) && (
                  <div className="flex justify-center gap-3 mb-4">
                    {linkedin && (
                      <a href={linkedin} target="_blank" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                        <Linkedin size={16} className="text-gray-600" />
                      </a>
                    )}
                    {portfolio && (
                      <a href={portfolio} target="_blank" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                        <Globe size={16} className="text-gray-600" />
                      </a>
                    )}
                  </div>
                )}
                
                {/* Open to Work Badge */}
                {isOpenToWork && (
                  <div className="flex justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-brand-green text-xs font-semibold border border-green-200">
                      <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse"></span>
                      Open to Work
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}