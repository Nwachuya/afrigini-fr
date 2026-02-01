'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { UserRecord, UserRole } from '@/types';
import { logout } from '@/lib/auth';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  Search,
  Users,
  CreditCard,
  Building2,
  Settings,
  PanelLeftClose,
  PanelLeft,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  user: UserRecord;
  userRole: UserRole;
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export default function Sidebar({ user, userRole, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const applicantLinks: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard/applicant', icon: <LayoutDashboard size={20} /> },
    { label: 'Jobs', href: '/jobs', icon: <Briefcase size={20} /> },
    { label: 'My Applications', href: '/my-applications', icon: <FileText size={20} /> },
    { label: 'My Profile', href: '/my-profile', icon: <User size={20} /> },
    { label: 'Settings', href: '/dashboard/account-settings', icon: <Settings size={20} /> },
  ];

  const recruiterLinks: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard/organization', icon: <LayoutDashboard size={20} /> },
    { label: 'Manage Jobs', href: '/manage-jobs', icon: <Briefcase size={20} /> },
    { label: 'Applications', href: '/applications', icon: <FileText size={20} /> },
    { label: 'Find Candidates', href: '/find-candidates', icon: <Search size={20} /> },
    { label: 'Team', href: '/dashboard/team', icon: <Users size={20} /> },
    { label: 'Billing', href: '/dashboard/billing', icon: <CreditCard size={20} /> },
    { label: 'Organization', href: '/dashboard/organization-settings', icon: <Building2 size={20} /> },
    { label: 'Settings', href: '/dashboard/account-settings', icon: <Settings size={20} /> },
  ];

  const links = userRole === 'Applicant' ? applicantLinks : recruiterLinks;

  const isActive = (href: string) => {
    if (href === pathname) return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const initial = user.email ? user.email[0].toUpperCase() : 'U';

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside
        className={`hidden md:flex fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40 flex-col transition-all duration-200 ease-in-out ${
          isOpen ? 'w-60' : 'w-16'
        }`}
      >
        {/* Top: Logo + Toggle */}
        <div className={`h-16 flex items-center border-b border-gray-200 ${isOpen ? 'justify-between px-3' : 'justify-center gap-1 px-1'}`}>
          {isOpen ? (
            <>
              <Image
                src="/afrigini_logo.png"
                alt="Afrigini Logo"
                width={120}
                height={32}
                className="object-contain h-8 w-auto"
                priority
              />
              <button
                onClick={onToggle}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <PanelLeftClose size={18} />
              </button>
            </>
          ) : (
            <>
              <span className="text-xl font-bold text-brand-green">A</span>
              <button
                onClick={onToggle}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <PanelLeft size={18} />
              </button>
            </>
          )}
        </div>

        {/* Middle: Navigation Links */}
        <nav className="flex-1 flex flex-col gap-1 p-2 mt-2 overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative ${
                isActive(link.href)
                  ? 'bg-brand-green/10 text-brand-green'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${!isOpen ? 'justify-center' : ''}`}
            >
              <span className="flex-shrink-0">{link.icon}</span>
              {isOpen && <span className="text-sm font-medium">{link.label}</span>}

              {/* Tooltip on collapsed */}
              {!isOpen && (
                <span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {link.label}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom: User + Logout */}
        <div className="border-t border-gray-200 p-2">
          {/* User info */}
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group relative ${
              !isOpen ? 'justify-center' : ''
            }`}
          >
            {user.avatar ? (
              <img
                src={`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${user.id}/${user.avatar}`}
                alt="Avatar"
                className="h-8 w-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {initial}
              </div>
            )}
            {isOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
              </div>
            )}

            {/* Tooltip on collapsed */}
            {!isOpen && (
              <span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {user.email}
              </span>
            )}
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors group relative ${
              !isOpen ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {isOpen && <span className="text-sm font-medium">Logout</span>}

            {/* Tooltip on collapsed */}
            {!isOpen && (
              <span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Edge toggle area - Desktop only */}
      <div
        onClick={onToggle}
        className={`hidden md:block fixed top-0 h-full w-1 cursor-ew-resize hover:bg-brand-green/20 transition-colors z-50 ${
          isOpen ? 'left-60' : 'left-16'
        }`}
      />
    </>
  );
}