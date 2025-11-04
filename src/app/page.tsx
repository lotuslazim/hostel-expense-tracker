
"use client";

import React from 'react';
import './landing.css';
import CardSwap, { Card } from '@/components/CardSwap';
import { Filter, SlidersHorizontal, Zap } from 'lucide-react';

export default function LandingDesktopPage() {

    const appFeatures = [
        { name: "Smooth", icon: <Zap /> },
        { name: "Customizable", icon: <SlidersHorizontal /> },
        { name: "Filterable", icon: <Filter /> },
    ];

    return (
        <div className="landing-container">
            {/* Left Section: Logo and Slogan */}
            <div className="landing-left-section">
                <div className="landing-content-wrapper">
                    <h1 className="landing-logo">Card stacks have never looked so good</h1>
                    <h3 className="landing-slogan">
                        Just look at it go!
                    </h3>
                </div>
            </div>

            {/* Right Section: Card Animation */}
            <div className="landing-right-section">
                <CardSwap cardDistance={-20} verticalDistance={-20} delay={4000} pauseOnHover={true}>
                    {appFeatures.map((feature, index) => (
                         <Card key={feature.name}>
                            <div className="card-header">
                                {feature.icon}
                                <h3>{feature.name}</h3>
                            </div>
                            <div className="card-content-wrapper">
                                <div className="card-content">
                                    <div className="card-number">{index + 1}</div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </CardSwap>
            </div>
        </div>
    );
}
