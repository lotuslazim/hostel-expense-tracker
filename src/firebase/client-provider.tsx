
'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { auth, firestore } from '@/firebase/config';
import app from '@/firebase/config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * This provider's main purpose is now to provide the user's authentication state.
 * Firebase services are initialized in firebase/config.ts and imported directly where needed.
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
