'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import pb from '@/lib/pocketbase';
import { getCurrentUser, getUserRole, logout } from '@/lib/auth';
import { UserRecord, UserRole } from '@/types';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
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
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password'];

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  // Load sidebar state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sidebarOpen');
    if (stored !== null) {
      setSidebarOpen(stored === 'true');
    }
    setMounted(true);
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebarOpen', String(sidebarOpen));
    }
  }, [sidebarOpen, mounted]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Auth state
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

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    router.push('/login');
  };

  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  // Show loading state until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  // Public pages: Navbar + content + Footer
  if (isPublicPage || !user) {
    return (
      <>
        <Navbar />
        <main className="flex-grow w-full">{children}</main>
        <Footer />
      </>
    );
  }

  const initial = user.email ? user.email[0].toUpperCase() : 'U';

  // Authenticated pages: Sidebar (desktop) + TopBar (mobile) + Mobile Drawer + content
  return (
    <>
      {/* Desktop Sidebar */}
      <Sidebar
        user={user}
        userRole={userRole!}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Mobile TopBar */}
      <TopBar
        user={user}
        userRole={userRole!}
        mobileMenuOpen={mobileMenuOpen}
        onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200">
          <span className="text-lg font-bold text-brand-green">Afrigini</span>
        </div>

        {/* Drawer Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
                isActive(link.href)
                  ? 'bg-brand-green/10 text-brand-green'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="flex-shrink-0">{link.icon}</span>
              <span className="text-sm font-medium">{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Drawer Footer: User + Logout */}
        <div className="border-t border-gray-200 p-3">
          {/* User info */}
          <div className="flex items-center gap-3 px-4 py-3">
            {user.avatar ? (
              <img
                src={`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${user.id}/${user.avatar}`}
                alt="Avatar"
                className="h-10 w-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {initial}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main
        className={`min-h-screen transition-all duration-200 ease-in-out pt-16 md:pt-0 ${
          sidebarOpen ? 'md:ml-60' : 'md:ml-16'
        }`}
      >
        {children}
      </main>
    </>
  );
}