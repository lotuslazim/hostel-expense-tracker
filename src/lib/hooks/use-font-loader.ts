"use client";

import { useState, useEffect } from 'react';

// This matches the variables set in src/app/layout.tsx
const FONT_FAMILIES = {
  body: 'var(--font-poppins)',
  headline: 'var(--font-playfair-display)',
};

export function useFontLoader() {
  const [areFontsLoaded, setAreFontsLoaded] = useState(false);

  useEffect(() => {
    // document.fonts is a browser API
    if (typeof window === 'undefined' || !document.fonts) {
      // Fallback for SSR or older browsers
      setAreFontsLoaded(true);
      return;
    }

    const checkFonts = async () => {
      try {
        const fontPromises = [
          document.fonts.load(`400 1em ${FONT_FAMILIES.body}`),
          document.fonts.load(`700 1em ${FONT_FAMILIES.headline}`),
        ];
        await Promise.all(fontPromises);
        setAreFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        // If fonts fail to load, proceed anyway to not block the app
        setAreFontsLoaded(true); 
      }
    };

    // Check if fonts are already loaded to avoid re-checking
    if (document.fonts.check(`1em ${FONT_FAMILIES.body}`) && document.fonts.check(`1em ${FONT_FAMILIES.headline}`)) {
        setAreFontsLoaded(true);
    } else {
        checkFonts();
    }
  }, []);

  return areFontsLoaded;
}
