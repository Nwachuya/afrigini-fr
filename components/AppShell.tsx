'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import pb from '@/lib/pocketbase';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { UserRecord, UserRole } from '@/types';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

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

  const isPublicPage = PUBLIC_PATHS.includes(pathname);
  const showSidebar = mounted && user && !isPublicPage;

  // Public pages: Navbar + content + Footer
  if (!showSidebar) {
    return (
      <>
        <Navbar />
        <main className="flex-grow w-full">{children}</main>
        <Footer />
      </>
    );
  }

  // Authenticated pages: Sidebar + TopBar (mobile only) + content
  return (
    <>
      <Sidebar
        user={user}
        userRole={userRole!}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <TopBar
        user={user}
        userRole={userRole!}
        sidebarOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      <main
        className={`pt-16 md:pt-0 min-h-screen transition-all duration-200 ease-in-out ${
          sidebarOpen ? 'ml-0 md:ml-60' : 'ml-0 md:ml-16'
        }`}
      >
        {children}
      </main>
    </>
  );
}