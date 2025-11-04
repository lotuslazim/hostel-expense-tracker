
"use client";

import React from 'react';
import CardSwap, { Card } from '@/components/CardSwap';
import { Filter, SlidersHorizontal, Zap } from 'lucide-react';
import Link from 'next/link';
import { LandingHeader } from '@/components/app/landing-header';
import DotGrid from '@/components/DotGrid';
import Image from 'next/image';

export default function LandingPage() {
    const appFeatures = [
        { name: "Smooth", icon: <Zap /> },
        { name: "Customizable", icon: <SlidersHorizontal /> },
        { name: "Filterable", icon: <Filter /> },
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
                    {appFeatures.map((feature, index) => (
                         <Card key={feature.name}>
                            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(0, 0, 0, 0.1)', color: '#333' }}>
                                {feature.icon}
                                <h3>{feature.name}</h3>
                            </div>
                            <div className="card-content-wrapper" style={{ flexGrow: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Image 
                                  src="/mascot.png"
                                  alt="BachelorBite Mascot"
                                  width={200}
                                  height={200}
                                  className="object-contain"
                                />
                            </div>
                        </Card>
                    ))}
                </CardSwap>
            </div>
        </div>
    );
}
