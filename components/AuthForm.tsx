'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, register } from '@/lib/auth';
import { UserRole } from '@/types';

export default function AuthForm({ type }: { type: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Applicant');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let user;
      if (type === 'login') user = await login(email, password);
      else user = await register(email, password, confirmPassword, role);
      
      if (user?.role === 'Applicant') router.push('/dashboard/applicant');
      else router.push('/dashboard/organization');
    } catch (err: any) {
      setError(err.message || 'Error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 border rounded" />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 border rounded" />
      {type === 'register' && (
        <>
          <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full p-2 border rounded" />
          <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full p-2 border rounded">
            <option value="Applicant">Applicant</option>
            <option value="Company">Company</option>
          </select>
        </>
      )}
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">{type === 'login' ? 'Login' : 'Register'}</button>
    </form>
  );
}
