
'use client';

import React, { useMemo, type ReactNode, useState, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
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
      const { initializeFirebase } = await import('@/firebase/index');
      firebaseServices = initializeFirebase();
      return firebaseServices;
    })();
  }
  
  return firebaseInitializationPromise;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<typeof firebaseServices>(null);

  useEffect(() => {
    getFirebaseServices().then(setServices);
  }, []);

  // Render a loading state or null while services are being initialized
  if (!services) {
    return null; // Or a full-page loader
  }

  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      auth={services.auth}
      firestore={services.firestore}
      storage={services.storage}
    >
      {children}
    </FirebaseProvider>
  );
}

    