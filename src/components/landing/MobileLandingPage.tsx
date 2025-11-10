
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
        <div className="h-screen w-screen overflow-hidden flex flex-col items-center justify-around py-8 yellow-gradient-bg text-slate-800">
            
            <div className="flex flex-col items-center text-center">
                <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 rounded-lg">Fast</Badge>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 rounded-lg">Simple</Badge>
                    <Badge variant="secondary" className="bg-sky-100 text-sky-800 rounded-lg">Smart</Badge>
                </div>
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
            <div className="w-full max-w-sm space-y-3">
                 <Link href="/signup" passHref>
                    <Button size="lg" className="w-full bg-black text-white rounded-xl font-bold uppercase tracking-wider shadow-lg hover:bg-black/90 transition-all text-base py-4 h-14">
                        Get Started
                    </Button>
                </Link>
                 <Link href="/login" passHref>
                     <Button variant="outline" size="lg" className="w-full text-black rounded-xl font-bold uppercase tracking-wider hover:bg-black/10 hover:text-black transition-all text-base py-4 h-14 border-black">
                        I Already Have An Account
                    </Button>
                </Link>
            </div>
        </div>
    );
}
