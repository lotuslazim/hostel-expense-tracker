"use client";

import { useEffect, use } from 'react';
import NProgress from 'nprogress';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = use(useSearchParams()); // use() is the modern way to read search params
  const router = useRouter();

  useEffect(() => {
    NProgress.configure({ showSpinner: false });

    const handleStart = () => NProgress.start();
    const handleStop = () => NProgress.done();

    // The initial router object from `useRouter` might not be the patched one.
    // We patch the methods on the `window.history` object, which `next/navigation` uses under the hood.
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      handleStart();
      originalPushState.apply(window.history, args);
    };

    window.history.replaceState = function (...args) {
      handleStart();
      originalReplaceState.apply(window.history, args);
    };

    // When the component mounts, and on subsequent path changes, we stop the progress bar.
    // This handles the initial load and back/forward browser button navigation.
    handleStop();

    // Cleanup function to restore original methods
    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [pathname, searchParams]); // Re-run effect when path changes to call handleStop()

  return null; // This component does not render anything.
}
