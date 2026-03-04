'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import pb from '@/lib/pocketbase';
import { UserRecord } from '@/types';
import { getDefaultOrgPath } from '@/lib/access';
import { getCurrentOrgMembership } from '@/lib/org-membership';

export default function DashboardRootPage() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      if (!pb.authStore.isValid) {
        router.replace('/login');
        return;
      }

      const user = pb.authStore.model as unknown as UserRecord;

      if (user?.role === 'Applicant') {
        router.replace('/candidates/applicant');
        return;
      }

      const membership = user ? await getCurrentOrgMembership(user.id) : null;
      router.replace(getDefaultOrgPath(membership?.role));
    };

    redirect();
  }, [router]);

  // Show a loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
