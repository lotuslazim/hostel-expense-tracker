
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

      // Dynamically handle Auth initialization for different environments
      const isDev = process.env.NODE_ENV === 'development';
      let auth: Auth;

      if (isDev && typeof window !== 'undefined') {
        // For development/preview, use initializeAuth to work with dynamic preview domains
        auth = initializeAuth(firebaseApp, {
          persistence: [indexedDBLocalPersistence, browserLocalPersistence],
          // This allows sign-in popups from the dynamically generated preview URLs
          popupRedirectResolver: undefined,
        });
      } else {
        // For production, use the standard getAuth
        auth = (await import('firebase/auth')).getAuth(firebaseApp);
      }
      
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
