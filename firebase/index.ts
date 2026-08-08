
'use client';

// This file is being simplified as initialization is now handled directly in the config file.
// It will now primarily re-export modules for easier access.

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';

// Re-exporting date-fns functions for convenience
export { startOfWeek } from 'date-fns/startOfWeek';
export { endOfWeek } from 'date-fns/endOfWeek';
export { startOfMonth } from 'date-fns/startOfMonth';
export { endOfMonth } from 'date-fns/endOfMonth';
export { startOfYear } from 'date-fns/startOfYear';
export { endOfYear } from 'date-fns/endOfYear';
export { differenceInDays } from 'date-fns/differenceInDays';

    