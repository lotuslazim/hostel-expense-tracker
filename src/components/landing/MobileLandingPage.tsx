

"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';

export function MobileLandingPage() {
    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col items-center yellow-gradient-bg text-slate-800 py-8 justify-around">
            
            <div className="flex flex-col items-center text-center">
                {/* This space is intentionally left to balance the layout */}
            </div>

            {/* Main Content Area - Centered */}
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
                     <p className="text-slate-500 max-w-xs text-center text-sm mb-2">
                        No notes, no Excel — just one tap, done.
                    </p>
                     <h1
                        className="font-extrabold tracking-tight leading-none text-5xl"
                        style={{ userSelect: "none" }}
                    >
                        <span className="text-slate-800">Bachelor</span>
                        <span className="text-secondary">Bite.</span>
                    </h1>
                     <p className="text-slate-600 max-w-xs text-center text-sm mt-3 font-medium">
                        Here to make your bachelor life easier because someone has to.
                    </p>
                </div>
            </div>
            
             {/* Call to action buttons at the bottom */}
            <div className="w-full max-w-sm space-y-3 px-4">
                 <Link href="/signup" passHref className="star-border-button">
                    <div className="button-content bg-black hover:bg-black/90">
                        <Button size="lg" variant="ghost" className="w-full text-white rounded-xl font-bold uppercase tracking-wider text-base py-4 h-14 hover:bg-transparent">
                            Get Started
                        </Button>
                    </div>
                </Link>
                 <Link href="/login" passHref className="star-border-button">
                     <div className="button-content bg-white hover:bg-white/90">
                        <Button variant="ghost" size="lg" className="w-full text-black rounded-xl font-bold uppercase tracking-wider transition-all text-base py-4 h-14 hover:bg-transparent">
                            I Already Have An Account
                        </Button>
                     </div>
                </Link>
            </div>
        </div>
    );
}
