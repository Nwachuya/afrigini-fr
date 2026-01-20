'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'Applicant') {
        router.push('/dashboard/applicant');
      } else {
        router.push('/dashboard/organization');
      }
    } catch (err: any) {
      setError("Invalid email or password.");
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
            <span className="text-blue-600 font-bold tracking-widest uppercase text-xs mb-2 block">Welcome Back</span>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">MEMBER LOGIN</h1>
            <p className="text-gray-500 mt-2">Access your dashboard and manage your profile.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                  <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline font-medium">
                    Forgot Password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-200 transition-all disabled:opacity-70 flex justify-center items-center gap-2 uppercase tracking-wide text-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <Link href="/register" className="text-blue-600 font-bold hover:underline">
                  Create Account
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
            System Operational
          </div>
          <h2 className="text-3xl font-bold mb-4">Precision Talent Intelligence.</h2>
          <p className="text-gray-400 leading-relaxed">
            Log in to access high-fidelity risk extraction and deep-scan assessment tools.
          </p>
        </div>
      </div>

    </div>
  );
}
