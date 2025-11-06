
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, Check, Calendar } from 'lucide-react';
import DotGrid from '@/components/DotGrid';

export function MobileLandingPage() {
    return (
        <div className="h-screen w-screen overflow-hidden relative flex flex-col items-center justify-between">
            {/* Feature Badges */}
            <div className="flex flex-wrap gap-2 justify-center pt-4 z-10">
                <div className="flex items-center gap-1.5 bg-white bg-opacity-70 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm text-[clamp(10px,2vw,12px)]">
                    <Zap className="w-4 h-4 text-slate-700" />
                    <span className="font-semibold text-slate-800">Fast</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white bg-opacity-70 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm text-[clamp(10px,2vw,12px)]">
                    <Check className="w-4 h-4 text-slate-700" />
                    <span className="font-semibold text-slate-800">Simple</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white bg-opacity-70 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm text-[clamp(10px,2vw,12px)]">
                    <Calendar className="w-4 h-4 text-slate-700" />
                    <span className="font-semibold text-slate-800">Smart</span>
                </div>
            </div>

            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
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
            <div className="flex flex-col items-center text-center z-10 w-full flex-grow justify-center">

                {/* Meet the text */}
                <p className="font-semibold text-slate-800 text-[clamp(20px,5vw,28px)] leading-none">
                    Meet the
                </p>

                {/* Adaptive Mascot Size */}
                <div className="relative 
                    w-[clamp(180px,55vw,260px)] 
                    h-[clamp(180px,55vw,260px)]"
                >
                    <Image
                        src="/mascot.png"
                        alt="BachelorBite Mascot"
                        fill
                        sizes="70vw"
                        className="object-contain drop-shadow-2xl"
                    />
                </div>

                {/* Brand Name */}
                <h1
                    className="font-extrabold tracking-tight leading-none mt-2"
                    style={{
                        fontSize: "clamp(40px, 10vw, 60px)",
                        userSelect: "none"
                    }}
                >
                    <span className="text-slate-800">Bachelor</span>
                    <span className="text-secondary">Bite.</span>
                </h1>

                {/* Tagline */}
                <p className="font-medium text-slate-800 mt-2 px-4"
                   style={{ fontSize: "clamp(14px, 3.5vw, 18px)" }}>
                    No notes, no Excel—just one tap, done.
                </p>

                {/* Description */}
                <p className="text-slate-800 max-w-xs mt-1 px-4"
                   style={{ fontSize: "clamp(12px, 3vw, 16px)" }}>
                    Here to make your bachelor life easier — because someone has to.
                </p>
            </div>

            {/* ✅ FLOATING CTA BUTTON */}
            <div className="w-full px-6 pb-6 z-10">
                <Link
                    href="/about"
                    className="bg-slate-800 text-white rounded-full font-bold 
                    flex items-center justify-center gap-2 shadow-2xl transition-all
                    w-full 
                    py-[clamp(14px,4vw,22px)] 
                    text-[clamp(16px,4.5vw,20px)]
                    hover:bg-slate-700"
                >
                    Get Started <ArrowRight className="h-[clamp(18px,5vw,22px)] w-auto" />
                </Link>
            </div>
        </div>
    );
}
