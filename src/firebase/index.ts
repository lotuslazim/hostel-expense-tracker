
'use client';

// This file is being simplified as initialization is now handled directly in the client provider.
// It will now primarily re-export modules for easier access.

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';

// Re-exporting date-fns functions for convenience
export { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, differenceInDays } from 'date-fns';
