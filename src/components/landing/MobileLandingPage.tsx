
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, Check, Calendar } from 'lucide-react';
import DotGrid from '@/components/DotGrid';

export function MobileLandingPage() {
    return (
        <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-between px-6 pb-6 relative yellow-gradient-bg overflow-y-auto">
            {/* DotGrid Background */}
            <div className="absolute inset-0 z-0">
                <DotGrid 
                    dotSize={2} 
                    gap={25} 
                    baseColor="rgba(0,0,0,0.05)" 
                    activeColor="rgba(0,0,0,0.1)" 
                    proximity={100} 
                    shockRadius={200} 
                    shockStrength={2} 
                    resistance={500} 
                    returnDuration={1} 
                />
            </div>

            {/* Content */}
            <div className="flex flex-col items-center w-full z-10 text-center gap-3">
                 {/* Feature Badges */}
                <div className="flex flex-wrap gap-2 justify-center mt-6 mb-2">
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

                {/* Meet the text */}
                <p className="text-2xl font-semibold text-slate-800 mb-2">Meet the</p>

                {/* Mascot */}
                <div className="relative w-80 h-80">
                    <Image 
                        src="/mascot.png" 
                        alt="BachelorBite Mascot" 
                        fill 
                        sizes="80vw" 
                        className="object-contain drop-shadow-2xl" 
                    />
                </div>

                {/* Brand Name */}
                <h1 className="text-6xl font-extrabold tracking-tight leading-none mb-2" style={{ userSelect: 'none' }}>
                    <span className="text-slate-800">Bachelor</span>
                    <span className="text-secondary">Bite.</span>
                </h1>

                {/* Tagline */}
                <p className="text-base text-slate-800 font-medium px-4 mb-2">
                    No notes, no Excel—just one tap, done.
                </p>

                {/* Description */}
                <p className="text-sm text-slate-800 max-w-xs mb-4 px-2">
                    Here to make your bachelor life easier — because someone has to.
                </p>
            </div>

            {/* CTA Button */}
            <div className="w-full pb-10 px-4 z-10">
                <Link
                    href="/about"
                    className="bg-slate-800 text-white px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 shadow-xl w-full hover:bg-slate-700 transition-all text-base"
                >
                    Get Started <ArrowRight className="h-5 w-5" />
                </Link>
            </div>
        </div>
    );
}
