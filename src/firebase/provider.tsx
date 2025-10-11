
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// User authentication state
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined context state
export interface FirebaseContextState extends UserAuthState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Return type for useUser()
export interface UserHookResult extends UserAuthState {}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

const createUserDocument = async (firestore: Firestore, user: User, name?: string) => {
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
 * FirebaseProvider manages and provides user authentication state,
 * including processing Google Sign-In redirect results.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  useEffect(() => {
    // This listener handles user state changes (login, logout)
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
        // After auth state is resolved, handle any pending redirect
        handleRedirectResult();
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
        setIsProcessingRedirect(false);
      }
    );
    
    // This effect runs once after the initial auth state is determined
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          await createUserDocument(firestore, result.user);
          
          if (window.location.pathname === '/login' || window.location.pathname === '/signup' || window.location.pathname === '/') {
             router.push('/dashboard');
          }
          toast({
            title: "Signed In",
            description: "Welcome back!",
          });
        }
      } catch (error: any) {
        // Ignore user-cancelled pop-up errors, but log others
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
           console.error("Error handling redirect result:", error);
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


    return () => unsubscribe();
  }, [auth, firestore, router, toast]);

  const contextValue = useMemo((): FirebaseContextState => ({
    firebaseApp,
    firestore,
    auth,
    ...userAuthState,
    // We adjust isUserLoading to account for the redirect processing as well
    isUserLoading: userAuthState.isUserLoading || isProcessingRedirect,
  }), [firebaseApp, firestore, auth, userAuthState, isProcessingRedirect]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};


/**
 * Hook to access the full Firebase context, including services and user state.
 * Use this if you need direct access to service instances like `auth` or `firestore`.
 * Throws an error if used outside a FirebaseProvider.
 */
export const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

/**
 * Hook specifically for accessing the authenticated user's state.
 * This is the preferred hook for most components that only need to know about the user.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  return {
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};
