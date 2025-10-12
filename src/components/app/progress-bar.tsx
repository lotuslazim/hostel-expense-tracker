
"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({ showSpinner: false });

    const handleStart = () => NProgress.start();
    const handleStop = () => NProgress.done();

    // We can't use next/router events since they were removed in app router
    // so we'll just listen for path changes.
    handleStop(); // Stop progress on initial load

    return () => {
      handleStop(); // Ensure progress stops on component unmount
    };
  }, [pathname, searchParams]);

  // The component doesn't render anything itself
  return null;
}
