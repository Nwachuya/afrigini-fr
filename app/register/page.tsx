'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register, login } from '@/lib/auth';
import { UserRole } from '@/types';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Applicant');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      await register(email, password, confirmPassword, role);
      const user = await login(email, password);
      
      if (user.role === 'Applicant') {
        router.push('/dashboard/applicant');
      } else {
        router.push('/dashboard/organization');
      }
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-64px)]">
      
      {/* LEFT COLUMN: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-16 lg:p-24 bg-white">
        <div className="max-w-md w-full mx-auto">
          
          <div className="mb-10">
            <span className="text-blue-600 font-bold tracking-widest uppercase text-xs mb-2 block">Start your journey</span>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">CREATE ACCOUNT</h1>
            <p className="text-gray-500 mt-2">Join the elite network of professionals and organizations.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Role Selector */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('Applicant')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${role === 'Applicant' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="text-sm font-bold text-gray-900 mb-1">Candidate</div>
                <div className="text-xs text-gray-500">I want to find a job</div>
              </button>
              <button
                type="button"
                onClick={() => setRole('Company')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${role === 'Company' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="text-sm font-bold text-gray-900 mb-1">Company</div>
                <div className="text-xs text-gray-500">I want to hire talent</div>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                  placeholder="name@example.com"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-200 transition-all disabled:opacity-70 flex justify-center items-center gap-2 uppercase tracking-wide text-sm"
            >
              {loading ? 'Creating Account...' : 'Get Started'}
            </button>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 font-bold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Image */}
      <div className="hidden lg:block w-1/2 relative bg-gray-900 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop" 
          alt="Security Technology" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-black/80 to-black/90"></div>
        
        <div className="absolute bottom-16 left-16 max-w-md text-white">
          <div className="flex items-center gap-2 mb-4 text-blue-400 text-xs font-bold uppercase tracking-widest">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            Live Network Status
          </div>
          <h2 className="text-3xl font-bold mb-4">Secure. Verified. Professional.</h2>
          <p className="text-gray-400 leading-relaxed">
            Join thousands of professionals using Afrigini to advance their careers and build world-class teams.
          </p>
        </div>
      </div>

    </div>
  );
}
