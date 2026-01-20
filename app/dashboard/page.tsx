'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import pb from '@/lib/pocketbase';
import { UserRecord } from '@/types';

export default function DashboardRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check auth state immediately
    if (!pb.authStore.isValid) {
      router.replace('/login');
      return;
    }

    const user = pb.authStore.model as unknown as UserRecord;

    // Redirect based on role
    if (user?.role === 'Applicant') {
      router.replace('/dashboard/applicant');
    } else {
      // Assumes 'Company', 'recruiter', 'owner', 'billing' go to org dashboard
      router.replace('/dashboard/organization');
    }
  }, [router]);

  // Show a loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
