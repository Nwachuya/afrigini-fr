'use client';

import { useState } from 'react';
import Link from 'next/link';
import pb from '@/lib/pocketbase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await pb.collection('users').requestPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      setError('Failed to send reset email. Please check the address.');
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
            <span className="text-blue-600 font-bold tracking-widest uppercase text-xs mb-2 block">Security Protocol</span>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">RECOVER ACCESS</h1>
            <p className="text-gray-500 mt-2">Enter your registered email to receive reset instructions.</p>
          </div>

          {success ? (
            <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-lg font-bold text-green-900">Check your email</h3>
              </div>
              <p className="text-green-800 text-sm mb-6">
                We have sent a secure password reset link to <strong>{email}</strong>.
              </p>
              <Link href="/login" className="text-green-700 font-bold hover:underline text-sm flex items-center gap-1">
                &larr; Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700 font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                  placeholder="name@company.com"
                />
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
                    Sending Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <div className="text-center pt-4">
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">
                  Return to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Image */}
      <div className="hidden lg:block w-1/2 relative bg-gray-900 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=2070&auto=format&fit=crop" 
          alt="Secure Server" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-black/80 to-black/90"></div>
        
        <div className="absolute bottom-16 left-16 max-w-md text-white">
          <div className="flex items-center gap-2 mb-4 text-blue-400 text-xs font-bold uppercase tracking-widest">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            Identity Verification
          </div>
          <h2 className="text-3xl font-bold mb-4">Secure Account Recovery.</h2>
          <p className="text-gray-400 leading-relaxed">
            Our automated systems ensure only authorized personnel can regain access to sensitive recruitment data.
          </p>
        </div>
      </div>

    </div>
  );
}
