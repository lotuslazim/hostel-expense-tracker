
'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { auth, firestore } from '@/firebase/config';
import app from '@/firebase/config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * This provider simply ensures that the Firebase services are passed
 * down on the client side. The core logic for auth state and redirect
 * handling is now centralized in FirebaseProvider.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
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
