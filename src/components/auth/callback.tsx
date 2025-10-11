"use client";

import { useEffect } from 'react';
import { getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log('Redirect sign-in successful:', result.user);
          router.push('/dashboard');
        } else {
          // No redirect result, go back to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Redirect sign-in error:', error);
        router.push('/login');
      }
    };

    handleRedirect();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">Completing sign-in...</span>
    </div>
  );
}