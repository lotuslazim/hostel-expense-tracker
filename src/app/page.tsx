
"use client";

import React, { useState, useEffect } from 'react';
import CardSwap, { Card } from '@/components/CardSwap';
import { Utensils, Calculator, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { LandingHeader } from '@/components/app/landing-header';
import DotGrid from '@/components/DotGrid';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';


export default function LandingPage() {
    const dashboardImage = PlaceHolderImages.find(p => p.id === 'app-dashboard');
    const reportImage = PlaceHolderImages.find(p => p.id === 'app-report');

    const appFeatures = [
        {
            name: "Welcome",
            icon: <Zap />,
            content: (
                <div className="w-full h-full grid grid-cols-2 items-center bg-gray-50">
                    <div className="p-6 flex flex-col justify-center h-full">
                        <Logo textColor="text-black" secondaryColor="text-green-600" />
                        <p className="mt-2 text-gray-600 text-xs">Your all-in-one solution for shared living.</p>
                        <ul className="mt-4 space-y-2 text-gray-700 text-xs">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                <span><span className="font-semibold">Log Meals:</span> Keep track of daily meals effortlessly.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                <span><span className="font-semibold">Track Expenses:</span> Record shared costs for groceries, bills, and more.</span>
                            </li>
                             <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                <span><span className="font-semibold">Auto-Settle:</span> Automatically calculate who owes what at the end of the month.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="h-full flex items-center justify-center bg-gray-100 p-4">
                        {/* Phone Mockup */}
                        <div className="relative w-48 h-96 bg-black rounded-[2.5rem] border-[10px] border-black shadow-2xl">
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-b-lg"></div>
                            <div className="w-full h-full rounded-[2rem] overflow-hidden">
                                 {/* Phone Screen Content */}
                                 <div className="w-full h-full bg-[#FFC247] flex flex-col items-center justify-between p-4">
                                    <div className="text-center mt-8">
                                        <p className="text-sm text-black/80">Meet the</p>
                                        <h1 className="font-headline text-2xl font-bold">
                                            <span className="text-black">Bachelor</span>
                                            <span className="text-green-600">Bite.</span>
                                        </h1>
                                        <p className="text-xs text-black/70 mt-1">No notes, no Excel—just one tap, done.</p>
                                    </div>
                                    <div className="relative w-32 h-32">
                                         <Image src="/mascot.png" alt="Mascot" layout="fill" objectFit="contain" />
                                    </div>
                                     <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full">
                                        Get Started
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            name: "Effortless Logging",
            icon: <Utensils />,
            content: (
                <div className={cn("card-feature-content", "relative w-full h-full text-white p-6 flex flex-col justify-end")}>
                     {dashboardImage && <Image src={dashboardImage.imageUrl} alt="Effortless Logging" fill className="object-cover" />}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                     <div className="relative z-10">
                        <Utensils className="h-8 w-8 text-primary mb-2" />
                        <h4 className="font-bold text-xl mb-1">Log Meals & Expenses</h4>
                        <p className="text-sm text-gray-200">Quickly log daily meals and shared expenses. No more forgotten payments or confusing notes.</p>
                     </div>
                </div>
            )
        },
        {
            name: "Auto Settlements",
            icon: <Calculator />,
            content: (
                <div className={cn("card-feature-content", "relative w-full h-full text-white p-6 flex flex-col justify-end")}>
                    {reportImage && <Image src={reportImage.imageUrl} alt="Auto Settlements" fill className="object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="relative z-10">
                        <Calculator className="h-8 w-8 text-primary mb-2" />
                        <h4 className="font-bold text-xl mb-1">Automatic Settlements</h4>
                        <p className="text-sm text-gray-200">Get a detailed report with a final settlement, all calculated automatically at the end of the month.</p>
                    </div>
                </div>
            )
        },
    ];

    return (
        <div className="landing-page-container yellow-gradient-bg text-slate-800 relative new-landing-style">
            <div className="absolute inset-0 z-0">
                <DotGrid
                    dotSize={2}
                    gap={25}
                    baseColor="rgba(0,0,0,0.1)"
                    activeColor="rgba(0,0,0,0.3)"
                    proximity={100}
                    shockRadius={200}
                    shockStrength={2}
                    resistance={500}
                    returnDuration={1}
                />
            </div>
            <LandingHeader />
            <div className="landing-left-section">
                {/* Left Text Section */}
                <div className="text-content">
                     <p className="text-lg text-black mb-2 font-medium">No notes, no Excel—just one tap, done.</p>
                     <h1 className="background-headline">
                        <span className="text-black">Bachelor</span><span className="text-secondary">Bite.</span>
                    </h1>
                    <p className="headline-main">
                        Here to make your bachelor life easier — because someone has to.
                    </p>

                    <div className="flex gap-4 mt-8">
                        <Link href="/signup" className="bg-black text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm">
                           <span></span> SIGN UP
                        </Link>
                         <Link href="/login" className="border border-black text-black px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-100 transition-all shadow-sm">
                           <span>▶</span> LOG IN
                         </Link>
                    </div>
                </div>
            </div>
            <div className="landing-right-section">
                <CardSwap
                    cardDistance={60}
                    verticalDistance={70}
                    delay={5000}
                    pauseOnHover={true}
                    onCardClick={() => {}}
                >
                    {appFeatures.map((feature) => (
                         <Card key={feature.name}>
                            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(0, 0, 0, 0.1)', color: '#333' }}>
                                {feature.icon}
                                <h3>{feature.name}</h3>
                            </div>
                            <div className="card-content-wrapper">
                                {feature.content}
                            </div>
                        </Card>
                    ))}
                </CardSwap>
            </div>
        </div>
    );
}
