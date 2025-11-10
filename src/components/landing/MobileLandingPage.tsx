
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
        <div className="min-h-screen w-screen overflow-hidden flex flex-col items-center justify-between p-6 bg-white text-slate-800">
            
            {/* Top Tags */}
            <div className="flex gap-2">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 rounded-lg">Fast</Badge>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 rounded-lg">Simple</Badge>
                <Badge variant="secondary" className="bg-sky-100 text-sky-800 rounded-lg">Smart</Badge>
            </div>

            {/* Main Content Area - Centered */}
            <div className="flex flex-col items-center text-center">
                <div className="relative w-48 h-48">
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
                        <span className="text-secondary">Bite.</span>
                    </h1>
                     <p className="font-semibold text-slate-600 mt-2 text-sm">
                        No notes, no Excel — just one tap, done.
                    </p>
                    <p className="text-slate-500 max-w-xs text-center text-sm mt-4">
                        Here to make your bachelor life easier because someone has to.
                    </p>
                </div>
            </div>
            
             {/* Call to action button at the bottom */}
            <div className="w-full max-w-sm">
                 <Link href="/signup" passHref>
                    <Button size="lg" className="w-full bg-black text-white rounded-xl font-semibold shadow-lg hover:bg-black/90 transition-all text-base py-6">
                        Let’s Go <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
