
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * A reusable card component that mimics the mobile landing page.
 * It's designed to be embedded in other components or pages.
 */
export function MobilePreviewCard() {
    return (
        <div className="w-[360px] h-[640px] flex flex-col items-center justify-between mobile-landing-gradient text-slate-800 p-8 rounded-3xl shadow-2xl overflow-hidden relative">
            
            <div className="flex flex-col items-center text-center gap-8">
                <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-black/10 border-black/20 text-slate-800">Fast</Badge>
                    <Badge variant="secondary" className="bg-black/10 border-black/20 text-slate-800">Simple</Badge>
                    <Badge variant="secondary" className="bg-black/10 border-black/20 text-slate-800">Smart</Badge>
                </div>
            
                <div className="flex flex-col items-center text-center">
                    <p className="font-semibold text-slate-600 tracking-wide">Meet the</p>
                    <div className="relative w-48 h-48 mt-2">
                        <Image
                            src="/mascot.png"
                            alt="BachelorBite Mascot"
                            fill
                            sizes="50vw"
                            className="object-contain drop-shadow-lg"
                        />
                    </div>

                    <div className="mt-4">
                         <h1
                            className="font-extrabold tracking-tight leading-none text-5xl"
                            style={{ userSelect: "none" }}
                        >
                            <span className="text-slate-800">Bachelor</span>
                            <span className="text-green-700">Bite.</span>
                        </h1>
                         <p className="text-slate-700 max-w-xs text-center text-sm mt-3 font-medium px-4">
                            No notes, no Excel — just one tap, done.
                        </p>
                         <p className="text-slate-600 max-w-xs text-center text-xs mt-2 px-4">
                            Here to make your bachelor life easier because someone has to.
                        </p>
                    </div>
                </div>
            </div>
            
             <div className="w-full max-w-sm space-y-3 px-4">
                <Link href="/signup" passHref className="star-border-button block">
                    <Button size="lg" className="button-content w-full bg-slate-800 text-white rounded-xl font-bold uppercase tracking-wider text-sm py-3 h-12 hover:bg-slate-800/90 active:bg-slate-800/80">
                        Get Started
                    </Button>
                </Link>
                <Link href="/login" passHref className="star-border-button block">
                    <Button size="lg" variant="outline" className="button-content w-full bg-white text-slate-800 border-slate-800 rounded-xl font-bold uppercase tracking-wider transition-all text-sm py-3 h-12 hover:bg-white/90 active:scale-[0.98]">
                        I Already Have An Account
                    </Button>
                </Link>
            </div>
        </div>
    );
}
