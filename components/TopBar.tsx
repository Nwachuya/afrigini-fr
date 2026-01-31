'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { UserRecord, UserRole } from '@/types';
import UserDropdown from './UserDropdown';

interface TopBarProps {
  user: UserRecord;
  userRole: UserRole;
  sidebarOpen: boolean;
  onMenuClick: () => void;
}

export default function TopBar({ user, userRole, sidebarOpen, onMenuClick }: TopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 md:hidden">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left: Menu button + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={20} />
          </button>
          
          <Link href="/dashboard">
            <Image
              src="/afrigini_logo.png"
              alt="Afrigini Logo"
              width={120}
              height={32}
              className="object-contain h-8 w-auto"
              priority
            />
          </Link>
        </div>

        {/* Right: User dropdown */}
        <UserDropdown user={user} userRole={userRole} />
      </div>
    </header>
  );
}