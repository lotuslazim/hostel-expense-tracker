
"use client";

import React from 'react';
import CardSwap, { Card } from '@/components/CardSwap';
import { Utensils, Calculator, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { LandingHeader } from '@/components/app/landing-header';
import DotGrid from '@/components/DotGrid';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';


export default function LandingPage() {
    const dashboardImage = PlaceHolderImages.find(p => p.id === 'app-dashboard');
    const reportImage = PlaceHolderImages.find(p => p.id === 'app-report');

    const appFeatures = [
        {
            name: "Welcome",
            icon: <Zap />,
            content: (
                <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 animated-bg-grid-green">
                    <div className="p-8 flex flex-col justify-center h-full text-white">
                         <h2 className="text-2xl font-bold font-headline mb-4">Welcome to BachelorBite.</h2>
                        <p className="text-slate-300 text-sm">Effortlessly log meals, track expenses, and split costs with your flatmates—no spreadsheets, no hassle, just simple living made easy.</p>
                    </div>
                     <div className="h-full flex items-center justify-center p-4" style={{ perspective: '1000px' }}>
                         <div className="relative w-40 h-80 bg-black rounded-[1.8rem] border-4 border-black shadow-lg" style={{ transform: 'rotateY(-20deg) rotateX(10deg) translateY(0) scale(0.9)' }}>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-b-lg"></div>
                            <div className="w-full h-full rounded-[1.5rem] overflow-hidden">
                                 <div className="w-full h-full bg-[#FFC247] flex flex-col items-center justify-between p-3">
                                     <p className="text-[10px] text-black/80 font-medium mt-1">Meet the</p>
                                    <div className="relative w-36 h-36">
                                         <Image src="/mascot.png" alt="Mascot" fill sizes="10vw" className="object-contain" />
                                    </div>
                                    <div className="text-center">
                                        <h1 className="font-headline text-[12px] font-bold leading-tight">
                                            <span className="text-black">Bachelor</span>
                                            <span className="text-green-600">Bite.</span>
                                        </h1>
                                        <p className="text-[8px] text-black/70 mt-0.5 px-1">No notes, no Excel—just one tap, done.</p>
                                    </div>
                                    <Button className="w-full h-5 text-[9px] bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-full">
                                        Get Started
                                        <ArrowRight className="ml-1 h-2 w-2" />
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
                     {dashboardImage && <Image src={dashboardImage.imageUrl} alt="Effortless Logging" fill sizes="33vw" className="object-cover" />}
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
                    {reportImage && <Image src={reportImage.imageUrl} alt="Auto Settlements" fill sizes="33vw" className="object-cover" />}
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
        <div className="landing-page-container text-slate-800 relative new-landing-style yellow-gradient-bg">
            <div className="absolute inset-0 z-0">
                <DotGrid
                    dotSize={2}
                    gap={25}
                    baseColor="rgba(255,255,255,0.1)"
                    activeColor="rgba(255,255,255,0.3)"
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
                     <p className="text-lg text-slate-800 mb-2 font-medium">No notes, no Excel—just one tap, done.</p>
                     <h1 className="background-headline">
                        <span className="text-slate-800">Bachelor</span><span className="text-secondary">Bite.</span>
                    </h1>
                    <p className="headline-main text-slate-600">
                        Here to make your bachelor life easier — because someone has to.
                    </p>

                    <div className="flex gap-4 mt-8">
                        <Link href="/signup" className="bg-black text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm">
                           <span></span> SIGN UP
                        </Link>
                         <Link href="/login" className="border border-black text-black px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-black/10 transition-all shadow-sm">
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
