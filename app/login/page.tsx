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

  const getErrorMessage = (err: any): string => {
    const message = err?.message?.toLowerCase() || '';
    
    if (message.includes('failed to authenticate') || message.includes('invalid credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    if (message.includes('user not found') || message.includes('no user')) {
      return 'No account found with this email address.';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Unable to connect to server. Please check your connection.';
    }
    if (message.includes('too many requests') || message.includes('rate limit')) {
      return 'Too many login attempts. Please wait a moment and try again.';
    }
    
    return 'Something went wrong. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      
      if (user.role === 'Applicant') {
        window.location.href = '/dashboard/applicant';
      } else {
        window.location.href = '/dashboard/organization';
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-80px)]">
      
      {/* LEFT COLUMN: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-start p-8 md:p-16 lg:p-24 bg-white z-10">
        <div className="max-w-md w-full">
          
          <div className="mb-10">
            <span className="text-brand-green font-bold tracking-widest uppercase text-xs mb-2 block">Welcome Back</span>
            <h1 className="text-4xl font-bold text-brand-dark tracking-tight">Member Login</h1>
            <p className="text-gray-500 mt-2">Access your dashboard and manage your profile.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none transition-all font-medium text-gray-900"
                  placeholder="name@example.com"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                  <Link href="/forgot-password" className="text-xs text-brand-green hover:underline font-bold">
                    Forgot Password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none transition-all font-medium text-gray-900"
                  placeholder="••••••••"
                />
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <Link href="/register" className="text-brand-green font-bold hover:underline">
                  Create Account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Image */}
      <div className="hidden lg:block w-1/2 relative bg-brand-dark overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070&auto=format&fit=crop" 
          alt="Professional team collaboration" 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent"></div>
        
        <div className="absolute bottom-16 left-16 right-16 text-white">
          <div className="flex items-center gap-2 mb-4 text-green-300 text-xs font-bold uppercase tracking-widest">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Africa's Talent Network
          </div>
          <h2 className="text-3xl font-bold mb-4">Connect with Top Opportunities.</h2>
          <p className="text-gray-300 leading-relaxed">
            Join thousands of professionals finding their next career move across Africa.
          </p>
        </div>
      </div>

    </div>
  );
}