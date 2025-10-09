
'use client';

import React, { useMemo, type ReactNode, useState, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { indexedDBLocalPersistence, browserLocalPersistence, initializeAuth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

type FirebaseServices = {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
};

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<FirebaseServices | null>(null);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    // This function will only run once on the client.
    const initialize = async () => {
      // Dynamically import Firebase services
      const { initializeFirebase, getSdks } = await import('@/firebase/index');
      
      const { firebaseApp } = initializeFirebase();

      // Use initializeAuth for consistent behavior across all environments.
      // It correctly handles persistence and dynamic domains for popups.
      const auth = initializeAuth(firebaseApp, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence],
        popupRedirectResolver: undefined, // Allows popups from dynamic preview URLs
      });
      
      const sdkServices = getSdks(firebaseApp, auth);
      
      setServices(sdkServices);
      setServicesLoading(false);
    };

    initialize();
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={services?.firebaseApp}
      auth={services?.auth}
      firestore={services?.firestore}
      storage={services?.storage}
      servicesLoading={servicesLoading}
    >
      {children}
    </FirebaseProvider>
  );
}
