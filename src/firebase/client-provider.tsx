
'use client';

import React, { type ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { auth, firestore } from '@/firebase/config';
import app from '@/firebase/config';
import { getRedirectResult, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

const createUserDocument = async (user: User, name?: string) => {
    const userDocRef = doc(firestore, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        id: user.uid,
        email: user.email,
        displayName: name || user.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL,
        groupId: null,
        isAdmin: false,
      });
    }
};


/**
 * This provider handles Firebase initialization and authentication state,
 * including processing Google Sign-In redirect results.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          await createUserDocument(result.user);
          // Only redirect if the user is not already on a protected route
          // This avoids unnecessary redirects if they refresh the dashboard
          if (window.location.pathname === '/login' || window.location.pathname === '/signup' || window.location.pathname === '/') {
             router.push('/dashboard');
          }
          toast({
            title: "Signed In",
            description: "Welcome back!",
          });
        }
      } catch (error: any) {
        console.error("Error handling redirect result:", error);
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
          toast({
            variant: "destructive",
            title: "Google Sign-In Failed",
            description: "Could not complete sign-in with Google. Please try again."
          });
        }
      } finally {
        setIsProcessingRedirect(false);
      }
    };

    handleRedirectResult();
  }, [router, toast]);

  // While processing the redirect, you might want to show a loading screen
  // For now, we'll just render children, but this could be enhanced.
  // if (isProcessingRedirect) {
  //   return <div>Loading...</div>;
  // }
  
  return (
    <FirebaseProvider
      firebaseApp={app}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
