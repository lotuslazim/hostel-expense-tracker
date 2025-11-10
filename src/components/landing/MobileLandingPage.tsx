
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MobileLandingPage() {
    return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-white p-4 py-8">
            {/* Top Badges */}
            <div className="flex justify-center gap-2">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Fast</Badge>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">Simple</Badge>
                <Badge variant="secondary" className="bg-sky-100 text-sky-800">Smart</Badge>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col items-center justify-center text-center my-auto">
                <p className="font-semibold text-slate-800" style={{ fontSize: "clamp(16px, 4vw, 20px)" }}>
                    Meet the
                </p>

                <div className="relative w-[clamp(220px,70vw,400px)] h-[clamp(220px,70vw,400px)] my-2">
                    <Image
                        src="/mascot.png"
                        alt="BachelorBite Mascot"
                        fill
                        sizes="70vw"
                        className="object-contain drop-shadow-2xl"
                    />
                     <div className="mascot-shadow"></div>
                </div>
                 <p className="font-medium text-slate-800 px-4 mt-2" style={{ fontSize: "clamp(12px, 3vw, 16px)" }}>
                    No notes, no Excel—just one tap, done.
                </p>
                <h1
                    className="font-extrabold tracking-tight leading-none"
                    style={{
                        fontSize: "clamp(62px, 15vw, 82px)",
                        userSelect: "none"
                    }}
                >
                    <span className="text-slate-800">Bachelor</span>
                    <span className="text-secondary">Bite.</span>
                </h1>

                <p className="text-slate-700 max-w-xs text-center"
                   style={{ fontSize: "clamp(14px, 3.5vw, 18px)" }}>
                    Here to make your bachelor life easier — <br/> because someone has to.
                </p>
            </div>
            
             {/* Call to action button at the bottom */}
            <div className="w-full max-w-sm">
                 <Link href="/signup" passHref>
                    <Button size="lg" className="w-full bg-black text-white rounded-xl font-semibold shadow-md hover:bg-black/90 transition-all">
                        Let's Go <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
