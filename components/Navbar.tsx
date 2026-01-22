'use client';

import Link from 'next/link';
import Image from 'next/image'; // Added Image component
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
      <div className="w-full px-6 lg:px-12 h-20 flex justify-between items-center">
        {/* Logo Section */}
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-3 group">
          {/* YOUR LOGO IMAGE */}
          <div className="relative h-10 w-auto">
            <Image 
              src="/afrigini_logo.png"  // <--- MAKE SURE YOUR FILE IS IN /public FOLDER
              alt="Afrigini Logo"
              width={150}      // Adjust width as needed
              height={40}      // Adjust height as needed
              className="object-contain h-10 w-auto"
              priority
            />
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          {!user ? (
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
