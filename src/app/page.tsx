
"use client";

import React from 'react';
import './landing.css';
import CardSwap, { Card } from '@/components/CardSwap';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LandingDesktopPage() {

    const appFeatures = [
        { name: "Log Meals & Expenses", imageId: "app-dashboard" },
        { name: "Automated Reports", imageId: "app-report" },
        { name: "Track Your Inventory", imageId: "app-inventory" },
        { name: "Community Chat", imageId: "landing-hero" }
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
                    {appFeatures.map(feature => {
                        const image = PlaceHolderImages.find(p => p.id === feature.imageId);
                        return (
                             <Card key={feature.name}>
                                {image && (
                                    <img 
                                        src={image.imageUrl} 
                                        alt={feature.name} 
                                        className="card-image" 
                                    />
                                )}
                                <div className="card-title-overlay">
                                    <h3>{feature.name}</h3>
                                </div>
                            </Card>
                        );
                    })}
                </CardSwap>
            </div>
        </div>
    );
}
