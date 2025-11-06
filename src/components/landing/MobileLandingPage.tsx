
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, Check, Calendar } from 'lucide-react';
import DotGrid from '@/components/DotGrid';

export function MobileLandingPage() {
    return (
        <div className="mobile-landing-gradient w-full min-h-screen flex flex-col items-center justify-center p-4 relative">
             <div className="absolute inset-0 z-0">
                <DotGrid dotSize={2} gap={25} baseColor="rgba(255,255,255,0.1)" activeColor="rgba(255,255,255,0.3)" proximity={100} shockRadius={200} shockStrength={2} resistance={500} returnDuration={1} />
            </div>
            <div className="flex flex-col items-center justify-center w-full h-full z-10 text-center">
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                    <div className="flex items-center gap-1.5 bg-white bg-opacity-70 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm text-xs">
                        <Zap className="w-4 h-4 text-slate-700" />
                        <span className="font-semibold text-slate-800">Fast</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white bg-opacity-70 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm text-xs">
                        <Check className="w-4 h-4 text-slate-700" />
                        <span className="font-semibold text-slate-800">Simple</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white bg-opacity-70 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm text-xs">
                        <Calendar className="w-4 h-4 text-slate-700" />
                        <span className="font-semibold text-slate-800">Smart</span>
                    </div>
                </div>
                <p className="text-xl font-medium text-slate-800">Meet the</p>
                <div className="relative w-64 h-64 my-2">
                    <Image src="/mascot.png" alt="Mascot" fill sizes="50vw" className="object-contain" />
                </div>
                <h1 className="text-5xl font-extrabold tracking-tighter leading-none -mt-4" style={{ userSelect: 'none' }}>
                    <span className="text-slate-800">Bachelor</span><span className="text-secondary">Bite.</span>
                </h1>
                <p className="text-sm text-slate-600 mt-2">No notes, no Excel—just one tap, done.</p>
                <p className="text-base text-slate-600 font-medium mt-1">
                    Here to make your bachelor<br/> life easier.
                </p>
                <Link
                    href="/about"
                    className="bg-secondary text-white px-6 py-3 mt-6 rounded-full font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg text-sm"
                >
                   Get Started <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </div>
    );
}
