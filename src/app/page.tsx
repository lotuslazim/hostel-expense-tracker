
"use client";

import React from 'react';
import Link from 'next/link';
import { LandingHeader } from '@/components/app/landing-header';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Logo } from '@/components/icons/logo';


export default function LandingPage() {
    return (
        <div className="new-landing-style min-h-screen flex flex-col items-center justify-between p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-retro-pattern z-0"></div>
            <LandingHeader />

            <div className="flex-grow flex flex-col items-center justify-center text-center z-10 w-full px-4">
                <main className="flex flex-col items-center justify-center">
                    <p className="text-lg md:text-xl font-medium text-slate-700 mb-2">Meet the</p>
                    <Logo 
                        isStacked 
                        mascotSize="large"
                        textSize="large"
                        textColor="text-slate-800"
                        secondaryColor="text-green-600"
                    />
                    <p className="text-base md:text-lg text-slate-500 mt-4 max-w-sm">
                        No notes, no Excel—just one tap, done.
                    </p>
                </main>
            </div>

            <div className="w-full max-w-sm z-10 pb-4">
                 <Link href="/signup">
                    <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full text-lg shadow-lg">
                        Get Started <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
