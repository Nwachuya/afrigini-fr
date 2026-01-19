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
    <nav className="bg-gray-900 text-white w-full shadow-md z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        {/* Logo */}
        <Link href={user ? '/dashboard' : '/'} className="text-2xl font-bold tracking-tight hover:text-gray-200 transition-colors">
          Afrigini
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-6">
          {!user ? (
            /* Logged Out State */
            <>
              <Link href="/login" className="text-sm font-medium hover:text-gray-300 transition-colors">
                Login
              </Link>
              <Link 
                href="/register" 
                className="px-4 py-2 text-sm font-medium bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              >
                Sign Up
              </Link>
            </>
          ) : (
            /* Logged In State */
            <>
              {userRole === 'Applicant' ? (
                /* Applicant Links */
                <div className="hidden md:flex space-x-6 text-sm font-medium">
                  <Link href="/dashboard/applicant" className="hover:text-blue-400 transition-colors">Dashboard</Link>
                  <Link href="/jobs" className="hover:text-blue-400 transition-colors">Jobs</Link>
                  <Link href="/my-applications" className="hover:text-blue-400 transition-colors">My Applications</Link>
                  <Link href="/my-profile" className="hover:text-blue-400 transition-colors">My Profile</Link>
                </div>
              ) : (
                /* Recruiter/Owner Links */
                <div className="hidden md:flex space-x-6 text-sm font-medium">
                  <Link href="/dashboard/organization" className="hover:text-blue-400 transition-colors">Dashboard</Link>
                  <Link href="/manage-jobs" className="hover:text-blue-400 transition-colors">Manage Jobs</Link>
                  <Link href="/applications" className="hover:text-blue-400 transition-colors">Applications</Link>
                  <Link href="/find-candidates" className="hover:text-blue-400 transition-colors">Find Candidates</Link>
                </div>
              )}

              {/* User Dropdown */}
              <div className="pl-2">
                <UserDropdown user={user} userRole={userRole!} />
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
