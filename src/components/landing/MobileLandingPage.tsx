
"use client";

import React from 'react';
import { MobilePreviewCard } from './MobilePreviewCard';

/**
 * The full-screen mobile landing page.
 * It uses the MobilePreviewCard and ensures it fills the viewport.
 */
export function MobileLandingPage() {
    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col items-center justify-center mobile-landing-gradient text-slate-800">
            <MobilePreviewCard />
        </div>
    );
}
