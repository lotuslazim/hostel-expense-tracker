
"use client";

import React, { useState, useEffect } from 'react';
import CardSwap, { Card } from '@/components/CardSwap';
import { Utensils, Calculator, Zap } from 'lucide-react';
import Link from 'next/link';
import { LandingHeader } from '@/components/app/landing-header';
import DotGrid from '@/components/DotGrid';
import Image from 'next/image';

const FloatingIcon = ({ icon: Icon, top, left, delay }: { icon: React.ElementType, top: string, left: string, delay: string }) => {
    const [duration, setDuration] = useState('8s');

    useEffect(() => {
        // This code now runs only on the client, after hydration
        setDuration(`${Math.random() * 5 + 5}s`);
    }, []);

    return (
        <div
          className="absolute text-white/80 animate-float"
          style={{
            top,
            left,
            animationDelay: delay,
            animationDuration: duration,
          }}
        >
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </div>
    );
};


export default function LandingPage() {
    const appFeatures = [
        { 
            name: "Welcome", 
            icon: <Zap />,
            content: (
                <div className="w-full h-full relative flex items-center justify-center overflow-hidden animated-bg-grid-green">
                    <FloatingIcon icon={Utensils} top="15%" left="10%" delay="0s" />
                    <FloatingIcon icon={Calculator} top="25%" left="80%" delay="1s" />
                    <FloatingIcon icon={Zap} top="70%" left="20%" delay="2s" />
                    <FloatingIcon icon={Utensils} top="85%" left="90%" delay="0.5s" />
                    <Image 
                      src="/mascot.png"
                      alt="BachelorBite Mascot"
                      width={200}
                      height={200}
                      className="object-contain relative z-10 animate-mascot-idle"
                    />
                    <div className="mascot-shadow"></div>
                </div>
            )
        },
        { 
            name: "Effortless Logging", 
            icon: <Utensils />,
            content: (
                <div className="card-feature-content">
                    <Utensils className="h-12 w-12 text-secondary mb-4" />
                    <h4 className="font-bold text-xl mb-2">Log Meals & Expenses</h4>
                    <p className="text-sm text-center">Quickly log daily meals and shared expenses. No more forgotten payments or confusing notes.</p>
                </div>
            )
        },
        { 
            name: "Auto Settlements", 
            icon: <Calculator />,
            content: (
                <div className="card-feature-content">
                    <Calculator className="h-12 w-12 text-secondary mb-4" />
                    <h4 className="font-bold text-xl mb-2">Automatic Settlements</h4>
                    <p className="text-sm text-center">Get a detailed report with a final settlement, all calculated automatically at the end of the month.</p>
                </div>
            )
        },
    ];

    return (
        <div className="landing-page-container yellow-gradient-bg text-slate-800 relative">
            <div className="absolute inset-0 z-0">
                <DotGrid
                    dotSize={2}
                    gap={25}
                    baseColor="rgba(0,0,0,0.3)"
                    activeColor="rgba(0,0,0,0.5)"
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
                     <p className="text-lg mb-2 font-medium">No notes, no Excel—just one tap, done.</p>
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

