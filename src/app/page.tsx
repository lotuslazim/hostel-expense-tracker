
"use client";

import React from 'react';
import CardSwap, { Card } from '@/components/CardSwap';
import { Utensils, Calculator, Zap, ArrowRight, Wallet, Check, Plus, FileText, BarChart2 } from 'lucide-react';
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
                 <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 bg-[#232A34]">
                    <div className="p-8 flex flex-col justify-center h-full">
                         <h2 className="text-2xl font-bold font-headline mb-4 text-[#FFC247]">Welcome to BachelorBite.</h2>
                        <p className="text-slate-300 text-sm">Effortlessly log meals, track expenses, and split costs with your flatmates—no spreadsheets, no hassle, just simple living made easy.</p>
                    </div>
                     <div className="h-full flex items-center justify-center p-4" style={{ perspective: '1000px' }}>
                         <div className="relative">
                            <div className="relative w-48 h-96 bg-black rounded-[2rem] border-4 border-black shadow-lg" style={{ transform: 'rotateY(-20deg) rotateX(10deg) translateY(-2rem) scale(0.8)' }}>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-b-lg"></div>
                                <div className="w-full h-full bg-[#232A24] flex flex-col items-center justify-between p-3">
                                         <p className="text-[10px] text-white/80 font-medium mt-2">Meet the</p>
                                        <div className="relative w-52 h-52">
                                             <Image src="/mascot.png" alt="Mascot" fill sizes="10vw" className="object-contain" />
                                        </div>
                                        <div className="text-center">
                                            <h1 className="font-headline text-lg font-bold leading-tight">
                                                <span className="text-white">Bachelor</span>
                                                <span className="text-green-600">Bite.</span>
                                            </h1>
                                            <p className="text-[8px] text-white/70 mt-0.5 px-1">No notes, no Excel—just one tap, done.</p>
                                        </div>
                                        <Button className="w-full h-5 text-[9px] bg-emerald-500 hover:bg-emerald-600 text-white rounded-full">
                                            Get Started
                                            <ArrowRight className="ml-1 h-2 w-2" />
                                        </Button>
                                     </div>
                                </div>
                            </div>
                            <div className="mascot-shadow"></div>
                         </div>
                    </div>
                </div>
            )
        },
        {
            name: "Effortless Logging",
            icon: <Utensils />,
            content: (
                 <div className="w-full h-full bg-slate-50 text-slate-800 p-8 flex flex-col justify-between">
                    <div className="relative flex-grow flex items-center justify-center">
                        <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>
                        <div className="relative w-72 bg-white rounded-2xl shadow-lg p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-amber-100 rounded-full">
                                    <Utensils className="h-6 w-6 text-amber-600" />
                                </div>
                                <p className="font-semibold text-lg">Log Today's Meal</p>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100">
                                <span className="font-medium text-slate-600">Lunch</span>
                                <div className="flex items-center gap-2">
                                    <button className="h-6 w-6 rounded-md bg-white border">-</button>
                                    <span className="font-bold w-4 text-center">1</span>
                                    <button className="h-6 w-6 rounded-md bg-white border">+</button>
                                </div>
                            </div>
                            <Button className="w-full bg-slate-800 text-white hover:bg-slate-700">
                                Confirm Entry <Check className="ml-2 h-4 w-4"/>
                            </Button>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h4 className="font-bold text-xl mb-1">Effortless Logging</h4>
                        <p className="text-sm text-slate-500">Log everything with a single tap — we’ll handle the rest. Every entry is automatically organized for easy tracking and hassle-free settlements.</p>
                        <Button variant="ghost" className="mt-4 p-0 h-auto text-green-600 hover:text-green-700">
                            Log an Entry <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )
        },
        {
            name: "Auto Settlements",
            icon: <Calculator />,
            content: (
                 <div className="w-full h-full bg-slate-50 text-slate-800 p-8 flex flex-col justify-between">
                    <div className="relative flex-grow flex items-center justify-center">
                        <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>
                        <div className="relative w-80 bg-white rounded-2xl shadow-lg p-6">
                             <div className="flex justify-between items-center mb-4">
                                <p className="text-sm font-semibold text-slate-400">Monthly Settlement</p>
                                <FileText className="h-5 w-5 text-slate-400" />
                            </div>
                             <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 rounded-xl bg-red-50 border-2 border-red-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-full"><Image src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=80&q=60" alt="Alice" width={32} height={32} className="rounded-full"/></div>
                                        <p className="font-semibold text-red-700">Alice Owes</p>
                                    </div>
                                    <p className="font-bold text-lg text-red-700">৳850.00</p>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-xl bg-green-50 border-2 border-green-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-full"><Image src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=80&q=60" alt="Bob" width={32} height={32} className="rounded-full" /></div>
                                        <p className="font-semibold text-green-700">Bob Gets Back</p>
                                    </div>
                                    <p className="font-bold text-lg text-green-700">৳1,250.00</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h4 className="font-bold text-xl mb-1">Automatic Settlements</h4>
                        <p className="text-sm text-slate-500">Let us take care of the numbers. Each month, we automatically prepare your final settlement and give you a clear, downloadable report — so wrapping up your accounts feels effortless.</p>
                        <Button variant="default" className="mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                            View Report <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
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
