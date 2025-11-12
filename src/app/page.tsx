
"use client";

import React from 'react';
import Link from 'next/link';
import { LandingHeader } from '@/components/app/landing-header';
import DotGrid from '@/components/DotGrid';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { MobileLandingPage } from '@/components/landing/MobileLandingPage';
import { MobilePreviewCard } from '@/components/landing/MobilePreviewCard';
import Image from 'next/image';


export default function LandingPage() {

    return (
        <div>
            {/* Desktop Layout */}
            <div className="hidden md:block yellow-gradient-bg min-h-screen">
                <div className="landing-page-container text-slate-800 relative">
                    <div className="absolute inset-0 z-0">
                        <DotGrid
                            dotSize={2}
                            gap={25}
                            baseColor="rgba(255,255,255,0.1)"
                            activeColor="rgba(255,255,255,0.3)"
                            proximity={100}
                            shockRadius={200}
                            shockStrength={2}
                            resistance={500}
                            returnDuration={1}
                        />
                    </div>
                    
                    <header className="absolute top-0 left-0 right-0 z-20 grid grid-cols-3 items-center p-8">
                        <div className="justify-self-start">
                            <Logo textColor="text-slate-800" secondaryColor="text-secondary" />
                        </div>
                        <div className="justify-self-center">
                            <LandingHeader />
                        </div>
                    </header>
                    
                    <div className="flex landing-left-section z-10">
                        <div className="flex-grow flex items-center">
                            <div className="text-content">
                                 <p className="text-2xl text-slate-800 font-medium">No notes, no Excel—just one tap, done.</p>
                                 <h1 className="text-[6.5rem] font-extrabold tracking-tighter leading-none my-4" style={{ userSelect: 'none' }}>
                                    <span className="text-slate-800">Bachelor</span><span className="text-secondary">Bite.</span>
                                </h1>
                                <p className="text-xl text-slate-600 font-medium">
                                    Here to make your bachelor life easier — <br/> because someone has to.
                                </p>
            
                                <div className="flex gap-4 mt-8">
                                    <Link href="/signup" className="bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition-all shadow-md">
                                       <span></span> SIGN UP
                                    </Link>
                                     <Link href="/login" className="border border-slate-800 text-slate-800 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-white/10 transition-all shadow-md">
                                       <span>▶</span> LOG IN
                                     </Link>
                                </div>
                            </div>
                        </div>
                         <div className="flex-grow-0" />
                    </div>
                    <div className="flex landing-right-section z-10">
                       <MobilePreviewCard />
                    </div>
                </div>
            </div>
    
            {/* Mobile Layout */}
            <div className="block md:hidden bg-white min-h-screen w-full">
                <MobileLandingPage />
            </div>
        </div>
    );
}
