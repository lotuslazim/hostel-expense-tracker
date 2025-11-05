
"use client";

import React, { useLayoutEffect, useRef } from 'react';
import CardSwap, { Card } from '@/components/CardSwap';
import { Utensils, Calculator, Zap, ArrowRight, Wallet, Check, Plus, FileText, BarChart2, Calendar, Leaf, Home, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { LandingHeader } from '@/components/app/landing-header';
import DotGrid from '@/components/DotGrid';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { gsap } from "gsap";


const FloatingElements = () => {
    const containerRef = useRef<HTMLDivElement>(null);
  
    useLayoutEffect(() => {
      const ctx = gsap.context(() => {
        const elements = gsap.utils.toArray(".floating-element-landing");
        elements.forEach((el: any) => {
          gsap.to(el, {
            y: 'random(-20, 20)',
            x: 'random(-10, 10)',
            duration: 'random(5, 8)',
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });
        });
      }, containerRef);
  
      return () => ctx.revert();
    }, []);
  
    const elements = [
        { Icon: Utensils, size: "w-8 h-8", top: "15%", left: "10%" },
        { Icon: BarChart2, size: "w-6 h-6", top: "25%", left: "80%" },
        { Icon: CheckCircle, size: "w-6 h-6", top: "70%", left: "20%" },
        { Icon: Wallet, size: "w-10 h-10", top: "85%", left: "90%" },
        { Icon: Leaf, size: "w-7 h-7", top: "50%", left: "5%" },
        { Icon: Home, size: "w-9 h-9", top: "80%", left: "50%" },
    ];
  
    return (
      <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden">
        {elements.map((el, i) => (
          <div
            key={i}
            className={`floating-element-landing absolute ${el.size} text-white opacity-20 filter drop-shadow-lg`}
            style={{ top: el.top, left: el.left }}
          >
            <el.Icon strokeWidth={1.5}/>
          </div>
        ))}
      </div>
    );
};


export default function LandingPage() {
    const dashboardImage = PlaceHolderImages.find(p => p.id === 'app-dashboard');
    const reportImage = PlaceHolderImages.find(p => p.id === 'app-report');

    const appFeatures = [
        {
            name: "Welcome",
            icon: <Zap />,
            content: (
                <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white p-8 md:p-12 overflow-hidden">
                    <div className="flex flex-col justify-center">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">
                           Welcome to <span className="text-gradient-brand">BachelorBite</span>.
                        </h2>
                        <p className="text-slate-300 text-sm leading-relaxed">Your shared living, simplified. Log meals, track expenses, and split costs with your flatmates — no spreadsheets, no stress.</p>
                    </div>
                     <div className="relative h-full flex items-center justify-center" style={{ perspective: '1000px' }}>
                         <div className="relative w-56 h-[30rem] transition-transform duration-500 hover:scale-105" style={{ transform: 'rotateY(-20deg) rotateX(10deg)' }}>
                            <div className="absolute inset-0 bg-lime-400/20 rounded-full blur-3xl -z-10"></div>
                            <div className="relative w-full h-full bg-black/50 rounded-[2rem] border-2 border-slate-700/50 shadow-2xl backdrop-blur-sm">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-900 rounded-b-lg"></div>
                                <div className="w-full h-full rounded-[1.8rem] overflow-hidden p-1.5">
                                     <div className="w-full h-full bg-[#FFC247] flex flex-col items-center justify-around p-3 rounded-[1.4rem]">
                                        <div className="mt-4">
                                            <p className="text-center text-xs text-slate-800 font-medium">Meet the</p>
                                            <div className="relative w-44 h-44 mt-1">
                                                 <Image src="/mascot.png" alt="Mascot" fill sizes="10vw" className="object-contain" />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <h1 className="font-headline text-lg font-bold leading-tight">
                                                <span className="text-slate-800">Bachelor</span>
                                                <span className="text-green-700">Bite.</span>
                                            </h1>
                                            <p className="text-[8px] text-black/70 mt-0.5 px-1">No notes, no Excel—just one tap, done.</p>
                                        </div>
                                        <div className="text-center w-full px-2">
                                            <Button className="w-full bg-black text-white text-xs font-bold py-3 rounded-xl shadow-md hover:bg-black/80 transition-colors">
                                                Get Started
                                            </Button>
                                        </div>
                                     </div>
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
                 <div className="w-full h-full bg-slate-50 text-slate-800 p-8 flex flex-col justify-between">
                    <div className="relative flex-grow flex items-center justify-center">
                        <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>
                        <div className="relative w-60 h-40 bg-white rounded-xl shadow-lg flex items-center justify-center p-4">
                            <div className="flex items-center gap-4">
                                <button className="flex flex-col items-center justify-center h-20 w-20 bg-amber-100 text-amber-600 rounded-lg shadow-sm hover:scale-105 transition-transform">
                                    <Utensils className="h-8 w-8"/>
                                    <span className="text-xs font-medium mt-1">Log Meal</span>
                                </button>
                                 <button className="flex flex-col items-center justify-center h-20 w-20 bg-green-100 text-green-600 rounded-lg shadow-sm hover:scale-105 transition-transform">
                                    <Wallet className="h-8 w-8"/>
                                    <span className="text-xs font-medium mt-1">Add Expense</span>
                                 </button>
                            </div>
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
                        <div className="relative w-72 bg-white rounded-2xl shadow-lg p-4">
                             <div className="flex justify-between items-center mb-3">
                                <p className="text-xs font-semibold text-slate-400">Monthly Settlement</p>
                                <FileText className="h-5 w-5 text-slate-400" />
                            </div>
                             <div className="space-y-3">
                                 <div className="flex justify-between items-center p-2 rounded-lg bg-red-100 border border-red-200">
                                    <p className="text-sm font-medium text-red-800">Alice Owes</p>
                                    <p className="font-bold text-red-800">৳850.00</p>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded-lg bg-green-100 border border-green-200">
                                    <p className="text-sm font-medium text-green-800">Bob Gets Back</p>
                                    <p className="font-bold text-green-800">৳1,250.00</p>
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
            {/* Common background and header for both layouts */}
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
            <div className="hidden md:block">
              <LandingHeader />
            </div>
            
            {/* Desktop Layout (hidden on mobile) */}
            <div className="hidden md:flex landing-left-section">
                <div className="flex-grow-0">
                    <Logo textColor="text-slate-800" secondaryColor="text-secondary" />
                </div>
                <div className="flex-grow flex items-center">
                    <div className="text-content">
                         <p className="text-2xl text-slate-800 font-medium">No notes, no Excel—just one tap, done.</p>
                         <h1 className="text-8xl font-extrabold tracking-tighter leading-none my-4" style={{ userSelect: 'none' }}>
                            <span className="text-slate-800">Bachelor</span><span className="text-secondary">Bite.</span>
                        </h1>
                        <p className="text-xl text-slate-600 font-medium">
                            Here to make your bachelor life easier — <br/> because someone has to.
                        </p>

                        <div className="flex gap-4 mt-8">
                            <Link href="/signup" className="bg-black text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition-all shadow-md">
                               <span></span> SIGN UP
                            </Link>
                             <Link href="/login" className="border border-black text-black px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-black/10 transition-all shadow-md">
                               <span>▶</span> LOG IN
                             </Link>
                        </div>
                    </div>
                </div>
                 <div className="flex-grow-0" />
            </div>
            <div className="hidden md:flex landing-right-section mt-16">
                <CardSwap
                    width={580}
                    height={480}
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

            {/* Mobile Layout (hidden on desktop) */}
            <div className="flex md:hidden flex-col items-center justify-center w-full min-h-screen mobile-landing-gradient p-4">
                <div className="absolute inset-0 z-0">
                    <DotGrid dotSize={2} gap={25} baseColor="rgba(255,255,255,0.1)" activeColor="rgba(255,255,255,0.3)" proximity={100} shockRadius={200} shockStrength={2} resistance={500} returnDuration={1} />
                </div>
                <div className="flex flex-col items-center justify-center w-full h-full z-10 text-center">
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                        <div className="flex items-center gap-1.5 bg-white bg-opacity-70 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm text-xs">
                            <Zap className="w-4 h-4 text-slate-700" />
                            <span className="font-semibold text-slate-800">Fast</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white bg-opacity-70 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm text-xs">
                            <Check className="w-4 h-4 text-slate-700" />
                            <span className="font-semibold text-slate-800">Simple</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white bg-opacity-70 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm text-xs">
                            <Calendar className="w-4 h-4 text-slate-700" />
                            <span className="font-semibold text-slate-800">Smart</span>
                        </div>
                    </div>
                    <p className="text-xl font-medium text-slate-800">Meet the</p>
                    <div className="relative w-64 h-64 my-2">
                        <Image src="/mascot.png" alt="Mascot" fill sizes="50vw" className="object-contain" />
                    </div>
                    <h1 className="text-5xl font-extrabold tracking-tighter leading-none -mt-4" style={{ userSelect: 'none' }}>
                        <span className="text-slate-800">Bachelor</span><span className="text-secondary">Bite.</span>
                    </h1>
                    <p className="text-sm text-slate-600 mt-2">No notes, no Excel—just one tap, done.</p>
                    <p className="text-base text-slate-600 font-medium mt-1">
                        Here to make your bachelor<br/> life easier.
                    </p>
                    <Link
                        href="/about"
                        className="bg-secondary text-white px-6 py-3 mt-6 rounded-full font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg text-sm"
                    >
                       Get Started <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
