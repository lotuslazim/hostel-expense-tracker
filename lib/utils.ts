import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const sanitizeFirestoreData = (data: Record<string, any>) => {
  const sanitizedData = { ...data };
  Object.keys(sanitizedData).forEach(key => {
    if (sanitizedData[key] === undefined) {
      delete sanitizedData[key];
    }
  });
  return sanitizedData;
};
