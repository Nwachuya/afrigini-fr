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
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-80px)]">
      
      {/* LEFT COLUMN: Form (Exact dimensions as Home) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-start p-8 md:p-16 lg:p-24 bg-white z-10">
        <div className="max-w-md w-full">
          
          <div className="mb-10">
            <span className="text-brand-green font-bold tracking-widest uppercase text-xs mb-2 block">
              Get Started
            </span>
            <h1 className="text-4xl font-bold text-brand-dark tracking-tight">Create Account</h1>
            <p className="text-gray-500 mt-2">Join the platform for top African talent.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Role Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">I am a...</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('Applicant')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${role === 'Applicant' ? 'border-brand-green bg-green-50 ring-1 ring-brand-green' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`text-sm font-bold mb-1 ${role === 'Applicant' ? 'text-brand-green' : 'text-gray-900'}`}>Candidate</div>
                  <div className="text-xs text-gray-500">Looking for jobs</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Company')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${role === 'Company' ? 'border-brand-green bg-green-50 ring-1 ring-brand-green' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`text-sm font-bold mb-1 ${role === 'Company' ? 'text-brand-green' : 'text-gray-900'}`}>Company</div>
                  <div className="text-xs text-gray-500">Hiring talent</div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none transition-all font-medium text-gray-900"
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none transition-all font-medium text-gray-900"
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none transition-all font-medium text-gray-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-green hover:bg-green-800 text-white font-bold rounded-xl shadow-lg hover:shadow-green-900/20 transition-all disabled:opacity-70 flex justify-center items-center gap-2 uppercase tracking-wide text-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="/login" className="text-brand-green font-bold hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Image */}
      <div className="hidden lg:block w-1/2 relative bg-brand-dark overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=1969&auto=format&fit=crop" 
          alt="African Professional" 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent opacity-90"></div>
        
        <div className="absolute bottom-16 left-16 right-16 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl text-white shadow-2xl">
          <div className="flex items-center gap-2 mb-4 text-green-300 text-xs font-bold uppercase tracking-widest">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Join the Community
          </div>
          <p className="text-xl font-medium leading-relaxed mb-6 font-serif italic">
            "Afrigini isn't just a job board; it's a career accelerator. The quality of opportunities here is unmatched."
          </p>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-white text-brand-green flex items-center justify-center font-bold text-lg">
              DK
            </div>
            <div>
              <p className="font-bold text-white">David Kalu</p>
              <p className="text-xs text-gray-300 uppercase tracking-wide">Senior Backend Engineer</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
