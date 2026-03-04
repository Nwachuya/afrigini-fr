'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';
import { UserRecord, UserRole } from '@/types';
import { canAccessBilling, canManageOrganization, canManageTeam } from '@/lib/access';

export default function UserDropdown({
  user,
  userRole,
  orgMembershipRole,
}: {
  user: UserRecord;
  userRole: UserRole;
  orgMembershipRole?: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
    setIsOpen(false);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Simple avatar initial
  const initial = user.email ? user.email[0].toUpperCase() : 'U';

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center space-x-2 focus:outline-none hover:opacity-80 transition-opacity"
      >
        <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold shadow-sm">
          {initial}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 uppercase font-semibold">Signed in as</p>
            <p className="text-sm font-medium truncate">{user.email}</p>
            <p className="text-xs text-blue-600 capitalize mt-1">{orgMembershipRole || userRole}</p>
          </div>

          {/* Company Specific Menu Items */}
          {userRole !== 'Applicant' && (
            <>
              {canManageTeam(orgMembershipRole) && (
                <Link href="/org/team" className="block px-4 py-2 text-sm hover:bg-gray-100">Team</Link>
              )}
              {canAccessBilling(orgMembershipRole) && (
                <Link href="/org/billing" className="block px-4 py-2 text-sm hover:bg-gray-100">Billing</Link>
              )}
              {canManageOrganization(orgMembershipRole) && (
                <Link href="/org/organization-settings" className="block px-4 py-2 text-sm hover:bg-gray-100">Organization Settings</Link>
              )}
              {(canManageTeam(orgMembershipRole) ||
                canAccessBilling(orgMembershipRole) ||
                canManageOrganization(orgMembershipRole)) && (
                <div className="border-t border-gray-100 my-1"></div>
              )}
            </>
          )}

          {/* Common Menu Items */}
          {userRole === 'Applicant' && (
            <Link href="/candidates/account-settings" className="block px-4 py-2 text-sm hover:bg-gray-100">Account Settings</Link>
          )}
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button 
            onClick={handleLogout} 
            className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
