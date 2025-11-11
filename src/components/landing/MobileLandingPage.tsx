
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
        <div className="h-screen w-screen overflow-hidden flex flex-col items-center animated-bg-grid-green text-slate-200 justify-start pt-24 gap-12">
            
            <div className="flex flex-col items-center text-center gap-4">
                <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-white/10 border-white/20 text-slate-200">Fast</Badge>
                    <Badge variant="secondary" className="bg-white/10 border-white/20 text-slate-200">Simple</Badge>
                    <Badge variant="secondary" className="bg-white/10 border-white/20 text-slate-200">Smart</Badge>
                </div>
            
                {/* Main Content Area - Centered */}
                <div className="flex flex-col items-center text-center">
                    <p className="font-semibold text-slate-400 tracking-wide">Meet the</p>
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
                            <span className="text-slate-200">Bachelor</span>
                            <span className="text-secondary">Bite.</span>
                        </h1>
                         <p className="text-slate-300 max-w-xs text-center text-sm mt-3 font-medium px-4">
                            No notes, no Excel — just one tap, done.
                        </p>
                         <p className="text-slate-400 max-w-xs text-center text-xs mt-2 px-4">
                            Here to make your bachelor life easier because someone has to.
                        </p>
                    </div>
                </div>
            </div>
            
             {/* Call to action buttons at the bottom */}
             <div className="w-full max-w-sm space-y-3 px-4">
                <Link href="/signup" passHref className="star-border-button block">
                    <Button size="lg" className="button-content w-full bg-white text-slate-800 rounded-xl font-bold uppercase tracking-wider text-base py-4 h-12 hover:bg-white/90">
                        Get Started
                    </Button>
                </Link>
                <Link href="/login" passHref className="star-border-button block">
                    <Button size="lg" variant="outline" className="button-content w-full bg-transparent text-white border-white/50 rounded-xl font-bold uppercase tracking-wider transition-all text-base py-4 h-12 hover:bg-white/10">
                        I Already Have An Account
                    </Button>
                </Link>
            </div>
        </div>
    );
}
