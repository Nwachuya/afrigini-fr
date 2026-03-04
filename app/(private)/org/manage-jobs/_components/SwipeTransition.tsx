'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'manage-jobs:last-pathname';

function getPathDepth(pathname: string | null): number {
  if (!pathname) {
    return 0;
  }

  if (pathname === '/org/manage-jobs') {
    return 0;
  }

  if (pathname === '/org/manage-jobs/new') {
    return 1;
  }

  if (pathname.endsWith('/view')) {
    return 1;
  }

  if (pathname.startsWith('/org/manage-jobs/')) {
    return 2;
  }

  return 0;
}

export default function SwipeTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  useEffect(() => {
    const previousPathname = typeof window !== 'undefined'
      ? window.sessionStorage.getItem(STORAGE_KEY)
      : null;

    const previousDepth = getPathDepth(previousPathname);
    const currentDepth = getPathDepth(pathname);

    setDirection(currentDepth >= previousDepth ? 'forward' : 'back');
    setIsVisible(false);

    if (typeof window !== 'undefined' && pathname) {
      window.sessionStorage.setItem(STORAGE_KEY, pathname);
    }

    const frame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div
      className={`transform-gpu transition-all duration-200 ease-out will-change-transform ${
        isVisible
          ? 'translate-x-0 opacity-100'
          : direction === 'forward'
            ? 'translate-x-8 opacity-0'
            : '-translate-x-8 opacity-0'
      }`}
    >
      {children}
    </div>
  );
}
