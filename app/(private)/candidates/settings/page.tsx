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

  const inputClass = 'w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 outline-none transition-all focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green';
  const disabledInputClass = 'w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed';
  const labelClass = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2';
  const primaryButtonClass = 'px-6 py-2.5 bg-brand-green text-white font-bold rounded-lg hover:bg-green-800 disabled:opacity-70 transition-colors shadow-lg shadow-green-900/10';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <span className="text-brand-green font-bold tracking-[0.2em] uppercase text-xs">Account</span>
            <h1 className="text-3xl font-bold text-brand-dark mt-2">Account Settings</h1>
            <p className="text-gray-500 mt-2">Manage your profile details, avatar, and password.</p>
          </div>
          <div className="rounded-2xl border border-green-100 bg-green-50 px-5 py-4 min-w-[180px]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Signed In As</p>
            <p className="mt-2 text-sm font-semibold text-brand-dark break-all">{email}</p>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <form onSubmit={handleProfileSubmit}>
              <div className="p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-r from-white via-green-50/40 to-white">
                <h2 className="text-lg font-semibold text-brand-dark">Profile Information</h2>
                <p className="text-sm text-gray-500 mt-1">Keep your personal details and avatar up to date.</p>
              </div>
              <div className="p-6 sm:p-8 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-brand-green to-green-800 flex items-center justify-center overflow-hidden flex-shrink-0 text-white shadow-lg shadow-green-900/10">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold">{name?.[0]?.toUpperCase() || email[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Profile Picture</label>
                    <label className="inline-flex px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      Upload Photo
                      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">PNG or JPG works best for your account image.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input 
                      type="email" 
                      value={email}
                      disabled
                      className={disabledInputClass}
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8 bg-gray-50 border-t border-gray-200 flex justify-end rounded-b-2xl">
                <button type="submit" disabled={saving} className={primaryButtonClass}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <form onSubmit={handlePasswordSubmit}>
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-white via-green-50/30 to-white">
                <h2 className="text-lg font-semibold text-brand-dark">Change Password</h2>
                <p className="text-sm text-gray-500 mt-1">Use a strong password you do not reuse elsewhere.</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className={labelClass}>Old Password</label>
                  <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputClass} />
                </div>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end rounded-b-2xl">
                <button type="submit" disabled={saving} className={primaryButtonClass}>
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
