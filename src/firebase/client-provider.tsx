
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
      // Dynamically import Firebase services to ensure they only run on the client
      const { initializeApp } = await import('firebase/app');
      const { getFirestore } = await import('firebase/firestore');
      const { getStorage } = await import('firebase/storage');
      const { firebaseConfig } = await import('@/firebase/config');

      const app = initializeApp(firebaseConfig);
      
      const auth = initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      });
      
      const firestore = getFirestore(app);
      const storage = getStorage(app);
      
      setServices({ firebaseApp: app, auth, firestore, storage });
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
