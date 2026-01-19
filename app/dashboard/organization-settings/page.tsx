'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import pb from '@/lib/pocketbase';
import { UserRecord } from '@/types';

export default function OrganizationSettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Org Data
  const [orgId, setOrgId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [about, setAbout] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadOrg = async () => {
      try {
        const user = pb.authStore.model as unknown as UserRecord;
        if (!user) {
          router.push('/login');
          return;
        }

        const memberRes = await pb.collection('org_members').getFirstListItem(
          `user = "${user.id}"`,
          { expand: 'organization', requestKey: null }
        );

        if (memberRes && memberRes.organization) {
          const org = memberRes.expand?.organization as any;
          setOrgId(org.id);
          setName(org.name || '');
          setWebsite(org.website || '');
          setAbout(org.about || '');
          
          if (org.logo) {
            setLogoUrl(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/organizations/${org.id}/${org.logo}`);
          }
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOrg();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('website', website);
      formData.append('about', about);

      if (fileInputRef.current?.files?.length) {
        formData.append('logo', fileInputRef.current.files[0]);
      }

      const updatedOrg = await pb.collection('organizations').update(orgId, formData);
      
      if (updatedOrg.logo) {
        setLogoUrl(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/organizations/${updatedOrg.id}/${updatedOrg.logo}?t=${Date.now()}`);
      }

      setMessage({ text: 'Settings saved successfully!', type: 'success' });
    } catch (err: any) {
      console.error("Save error:", err);
      setMessage({ text: err.message || 'Failed to save settings.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500">Loading settings...</div>;
  if (!orgId) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
        No organization found. Please contact support.
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization Settings</h1>
      <p className="text-gray-500 mb-8">Manage your company branding and details.</p>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b border-gray-100">
            <div className="h-24 w-24 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 overflow-hidden flex-shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Company Logo" className="h-full w-full object-contain" />
              ) : (
                <span className="text-3xl text-gray-400">🏢</span>
              )}
            </div>
            <div className="flex-grow">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Company Logo</label>
              <div className="flex items-center gap-4">
                <label className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                  Upload New
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </label>
                <span className="text-xs text-gray-500">Recommended: 400x400px (PNG/JPG)</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                <input 
                  type="url" 
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://company.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">About the Company</label>
              <textarea 
                rows={4}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Tell candidates what makes your company great..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y"
              ></textarea>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 flex items-center"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
