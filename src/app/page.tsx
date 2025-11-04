
"use client";

import React from 'react';
import CardSwap, { Card } from '@/components/CardSwap';
import { Filter, SlidersHorizontal, Zap } from 'lucide-react';
import { Logo } from '@/components/icons/logo';

export default function LandingPage() {
    const appFeatures = [
        { name: "Smooth", icon: <Zap /> },
        { name: "Customizable", icon: <SlidersHorizontal /> },
        { name: "Filterable", icon: <Filter /> },
    ];

    return (
        <div className="landing-page-container">
            <div className="landing-left-section">
                <div className="text-content">
                    <h2 className="headline-top">No notes, no Excel—just one tap, done.</h2>
                    <div className="brand-name">
                        <Logo textSize="large" textColor="text-primary-foreground" secondaryColor="text-secondary" />
                    </div>
                    <p className="sub-headline">Here to make your bachelor life easier — because someone has to. 😌</p>
                </div>
            </div>
            <div className="landing-right-section">
                <CardSwap
                    cardDistance={60}
                    verticalDistance={70}
                    delay={5000}
                    pauseOnHover={true}
                >
                    {appFeatures.map((feature, index) => (
                        <Card key={feature.name}>
                            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(0, 0, 0, 0.1)', color: '#333' }}>
                                {feature.icon}
                                <h3>{feature.name}</h3>
                            </div>
                            <div className="card-content-wrapper" style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
                                <div className="card-content" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div className="card-number" style={{ fontSize: '12rem', fontWeight: 700, color: 'rgba(192, 132, 252, 0.8)', textShadow: '0 0 30px rgba(192, 132, 252, 0.3)' }}>{index + 1}</div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </CardSwap>
            </div>
        </div>
    );
}
