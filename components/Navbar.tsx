'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbase'; 
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { UserRecord, UserRole } from '@/types';
import UserDropdown from './UserDropdown';

export default function Navbar() {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const updateState = () => {
      setUser(getCurrentUser());
      setUserRole(getUserRole());
    };

    updateState();

    const unsubscribe = pb.authStore.onChange(() => {
      updateState();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <nav className="bg-white w-full border-b border-gray-200 sticky top-0 z-50">
      {/* Changed max-w-7xl to w-full and adjusted padding for full width */}
      <div className="w-full px-6 lg:px-12 h-20 flex justify-between items-center">
        {/* Logo */}
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 group">
          <div className="text-brand-green">
             <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
               <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
             </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight text-brand-dark">AFRIGINI</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          {!user ? (
            /* Logged Out State */
            <>
              <Link 
                href="/login" 
                className="text-sm font-bold text-gray-600 hover:text-brand-green transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="px-6 py-2.5 text-sm font-bold bg-brand-green text-white rounded-lg hover:bg-green-800 transition-colors shadow-sm"
              >
                Sign Up
              </Link>
            </>
          ) : (
            /* Logged In State */
            <>
              {userRole === 'Applicant' ? (
                <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
                  <Link href="/dashboard/applicant" className="hover:text-brand-green transition-colors">Dashboard</Link>
                  <Link href="/jobs" className="hover:text-brand-green transition-colors">Jobs</Link>
                  <Link href="/my-applications" className="hover:text-brand-green transition-colors">My Applications</Link>
                  <Link href="/my-profile" className="hover:text-brand-green transition-colors">My Profile</Link>

                </div>
              ) : (
                <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
                  <Link href="/dashboard/organization" className="hover:text-brand-green transition-colors">Dashboard</Link>
                  <Link href="/manage-jobs" className="hover:text-brand-green transition-colors">Manage Jobs</Link>
                  <Link href="/applications" className="hover:text-brand-green transition-colors">Applications</Link>
                  <Link href="/find-candidates" className="hover:text-brand-green transition-colors">Find Candidates</Link>
                  <Link href="/manage-jobs/new" className="hover:text-brand-green transition-colors">Add Job</Link>


                </div>
              )}

              <div className="pl-2 border-l border-gray-200">
                <UserDropdown user={user} userRole={userRole!} />
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
