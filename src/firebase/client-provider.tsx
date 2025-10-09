
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

// Lazy-loaded Firebase services
let firebaseServices: {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
} | null = null;

// Promise to ensure Firebase is initialized only once
let firebaseInitializationPromise: Promise<typeof firebaseServices> | null = null;

async function getFirebaseServices() {
  if (firebaseServices) {
    return firebaseServices;
  }

  if (!firebaseInitializationPromise) {
    firebaseInitializationPromise = (async () => {
      const { initializeFirebase, getSdks } = await import('@/firebase/index');
      const { firebaseApp } = initializeFirebase();

      // For all environments (dev, preview, prod), use initializeAuth to ensure consistency
      // and proper handling of persistence and dynamic domains.
      const auth = initializeAuth(firebaseApp, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence],
        // This allows sign-in popups from dynamically generated preview URLs
        popupRedirectResolver: undefined,
      });
      
      firebaseServices = getSdks(firebaseApp, auth);
      return firebaseServices;
    })();
  }
  
  return firebaseInitializationPromise;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<typeof firebaseServices>(null);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    getFirebaseServices().then(loadedServices => {
        setServices(loadedServices);
        setServicesLoading(false);
    });
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
