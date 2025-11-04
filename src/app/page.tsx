"use client";

import React from 'react';
import CardSwap, { Card } from '@/components/CardSwap';
import { Filter, SlidersHorizontal, Zap } from 'lucide-react';

export default function LandingPage() {
    const appFeatures = [
        { name: "Smooth", icon: <Zap /> },
        { name: "Customizable", icon: <SlidersHorizontal /> },
        { name: "Filterable", icon: <Filter /> },
    ];

    return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0D12' }}>
            <div style={{ height: '600px', width: '100%', maxWidth: '1200px', position: 'relative' }}>
                <CardSwap
                    cardDistance={60}
                    verticalDistance={70}
                    delay={5000}
                    pauseOnHover={true}
                >
                    {appFeatures.map((feature, index) => (
                        <Card key={feature.name}>
                            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#F0F0F5' }}>
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
