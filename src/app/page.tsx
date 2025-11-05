
"use client";

import React from 'react';
import Link from 'next/link';
import { LandingHeader } from '@/components/app/landing-header';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Utensils, Wallet } from 'lucide-react';
import { Logo } from '@/components/icons/logo';


export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-background">
            <LandingHeader />

            {/* Left Section */}
            <div className="flex-1 flex items-center justify-center p-8 lg:p-12 text-center lg:text-left bg-white">
                <div className="max-w-md w-full">
                    <Logo 
                        isStacked={false}
                        mascotSize='default'
                        textSize='large'
                        textColor="text-slate-800"
                        secondaryColor="text-green-600"
                        className="justify-center lg:justify-start"
                    />
                    <h1 className="mt-6 text-3xl md:text-4xl font-bold font-headline text-slate-800">
                        Welcome to BachelorBite.
                    </h1>
                    <p className="mt-4 text-base md:text-lg text-slate-600">
                        Effortlessly log meals, track expenses, and split costs with your flatmates—no spreadsheets, no hassle, just simple living made easy.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <Link href="/signup">
                            <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white rounded-full text-lg shadow-lg">
                                Get Started <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                         <Link href="/about">
                            <Button size="lg" variant="ghost" className="w-full sm:w-auto">
                               Learn more
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex-1 bg-[#1C1C1C] flex items-center justify-center p-4 relative overflow-hidden">
                <div 
                    className="relative w-[280px] h-[570px] bg-neutral-900 rounded-[40px] border-[10px] border-neutral-950 overflow-hidden shadow-2xl transition-transform duration-300 ease-in-out"
                    style={{
                        transform: 'rotateX(10deg) rotateY(-15deg) rotateZ(3deg) scale(0.95)',
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {/* The screen content of the phone mockup */}
                    <div className="w-full h-full bg-[#FFC247] flex flex-col items-center justify-between p-4">
                        <div className="flex-grow flex flex-col items-center justify-center text-center w-full">
                             <main className="flex flex-col items-center justify-center">
                                <p className="text-lg font-medium text-slate-700 mb-2">Meet the</p>
                                <Logo 
                                    isStacked 
                                    mascotSize="large"
                                    textSize="large"
                                    textColor="text-slate-800"
                                    secondaryColor="text-green-600"
                                />
                                <p className="text-base text-slate-500 mt-4 max-w-sm">
                                    No notes, no Excel—just one tap, done.
                                </p>
                            </main>
                        </div>
                        <div className="w-full max-w-sm pb-2">
                             <Link href="/signup">
                                <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full text-lg shadow-lg">
                                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
