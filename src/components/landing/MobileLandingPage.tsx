
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function MobileLandingPage() {
    return (
        <div className="h-screen w-screen overflow-hidden relative flex flex-col justify-center items-center">
            
            {/* Content in the middle */}
            <div className="flex flex-col items-center justify-center z-10 w-full px-4">
                <p className="font-semibold text-slate-800 text-[clamp(20px,5vw,28px)] leading-none">
                    Meet the
                </p>

                <div className="relative w-[clamp(200px,65vw,350px)] h-[clamp(200px,65vw,350px)]">
                    <Image
                        src="/mascot.png"
                        alt="BachelorBite Mascot"
                        fill
                        sizes="60vw"
                        className="object-contain drop-shadow-2xl"
                    />
                    <div className="mascot-shadow"></div>
                </div>

                <p className="font-medium text-slate-800" style={{ fontSize: "clamp(12px, 3vw, 16px)" }}>
                    No notes, no Excel—just one tap, done.
                </p>

                <h1
                    className="font-extrabold tracking-tight leading-none my-1"
                    style={{
                        fontSize: "clamp(60px, 16vw, 80px)",
                        userSelect: "none"
                    }}
                >
                    <span className="text-slate-800">Bachelor</span>
                    <span className="text-secondary">Bite.</span>
                </h1>

                <p className="text-slate-700 max-w-xs text-center mt-2"
                   style={{ fontSize: "clamp(14px, 3.5vw, 18px)" }}>
                    Here to make your bachelor life easier — <br/> because someone has to.
                </p>
            </div>
            
             {/* Call to action buttons at the bottom */}
            <div className="absolute bottom-8 flex gap-4 w-full max-w-sm px-4 z-10">
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
