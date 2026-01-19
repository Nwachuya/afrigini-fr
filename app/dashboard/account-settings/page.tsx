'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import pb from '@/lib/pocketbase';
import { UserRecord } from '@/types';

export default function AccountSettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // User Data
  const [user, setUser] = useState<UserRecord | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Display only
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Password Change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = pb.authStore.model as unknown as UserRecord;
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);
        setName(currentUser.name || '');
        setEmail(currentUser.email || '');

        if (currentUser.avatar) {
          setAvatarUrl(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${currentUser.id}/${currentUser.avatar}`);
        }
      } catch (err) {
        console.error("Error loading user:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [router]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const formData = new FormData();
      formData.append('name', name);

      if (fileInputRef.current?.files?.length) {
        formData.append('avatar', fileInputRef.current.files[0]);
      }

      const updatedUser = await pb.collection('users').update(user.id, formData);
      
      if (updatedUser.avatar) {
        setAvatarUrl(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${updatedUser.id}/${updatedUser.avatar}?t=${Date.now()}`);
      }

      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      await pb.collection('users').update(user!.id, {
        password: newPassword,
        passwordConfirm: confirmPassword,
        oldPassword: oldPassword,
      });

      setMessage({ text: 'Password updated successfully!', type: 'success' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update password.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500">Loading account...</div>;
  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">Manage your personal information and password.</p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          {/* Profile Information Form */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <form onSubmit={handleProfileSubmit}>
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden flex-shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl text-gray-400 font-bold">{name?.[0]?.toUpperCase() || email[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Picture</label>
                    <label className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg cursor-pointer hover:bg-gray-50">
                      Upload Photo
                      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input 
                      type="email" 
                      value={email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end rounded-b-xl">
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70">
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1">
          {/* Change Password Form */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <form onSubmit={handlePasswordSubmit}>
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Old Password</label>
                  <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end rounded-b-xl">
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70">
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
