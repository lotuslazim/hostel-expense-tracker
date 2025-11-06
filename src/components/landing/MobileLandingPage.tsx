
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, Check, Calendar } from 'lucide-react';

export function MobileLandingPage() {
    return (
        <div className="h-screen w-screen overflow-hidden relative flex flex-col items-center justify-around">
             <div className="flex flex-wrap gap-2 justify-center z-10">
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

            {/* Content */}
            <div className="relative flex flex-col items-center justify-center z-10 w-full">

                {/* Meet the text */}
                <p className="font-semibold text-slate-800 text-[clamp(16px,4vw,22px)] leading-none">
                    Meet the
                </p>

                {/* Adaptive Mascot Size */}
                <div className="relative w-[clamp(200px,60vw,350px)] h-[clamp(200px,60vw,350px)]">
                    <Image
                        src="/mascot.png"
                        alt="BachelorBite Mascot"
                        fill
                        sizes="60vw"
                        className="object-contain drop-shadow-2xl"
                    />
                    <div className="mascot-shadow"></div>
                </div>
                
                 <p className="font-medium text-slate-800 px-4" style={{ fontSize: "clamp(12px, 3vw, 16px)" }}>
                    No notes, no Excel—just one tap, done.
                </p>
                {/* Brand Name */}
                <h1
                    className="font-extrabold tracking-tight leading-none"
                    style={{
                        fontSize: "clamp(48px, 13vw, 72px)",
                        userSelect: "none"
                    }}
                >
                    <span className="text-slate-800">Bachelor</span>
                    <span className="text-secondary">Bite.</span>
                </h1>

                {/* Description */}
                <p className="text-slate-800 max-w-xs px-4 text-center"
                   style={{ fontSize: "clamp(12px, 3vw, 16px)" }}>
                    Here to make your bachelor life easier — because someone has to.
                </p>
            </div>
            
             {/* Call to action buttons */}
            <div className="flex gap-4 w-full max-w-sm px-4 z-10">
                <Link href="/signup" className="flex-1 bg-black text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md">
                    <span>SIGN UP</span>
                </Link>
                <Link href="/login" className="flex-1 border border-black text-black px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-black/10 transition-all shadow-md">
                    <span>LOG IN</span>
                </Link>
            </div>
        </div>
    );
}
