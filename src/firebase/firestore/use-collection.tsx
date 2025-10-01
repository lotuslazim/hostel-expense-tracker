'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  getDocs,
} from 'firebase/firestore';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
  refetch: () => void;
}

export function useCollection<T = any>(
  targetRefOrQuery: CollectionReference<DocumentData> | Query<DocumentData> | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  const fetchData = useCallback(async (sourceQuery: CollectionReference<DocumentData> | Query<DocumentData>) => {
    setIsLoading(true);
    try {
      const snapshot = await getDocs(sourceQuery);
      const results: WithId<T>[] = snapshot.docs.map(doc => ({
        ...(doc.data() as T),
        id: doc.id,
      }));
      setData(results);
      setError(null);
    } catch (err: any) {
      console.error('Firestore getDocs error:', err);
      setError(err);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!targetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Initial fetch
    fetchData(targetRefOrQuery);

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      targetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: WithId<T>[] = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id,
        }));
        setData(results);
        setIsLoading(false); // New data arrived
        setError(null);
      },
      (err: FirestoreError) => {
        console.error('Firestore snapshot error:', err);
        setError(err);
        setIsLoading(false);
        setData(null);
      }
    );

    return () => unsubscribe();
  }, [targetRefOrQuery, fetchData]);
  
  const refetch = useCallback(() => {
    if(targetRefOrQuery) {
        fetchData(targetRefOrQuery);
    }
  }, [targetRefOrQuery, fetchData]);


  return { data, isLoading, error, refetch };
}
