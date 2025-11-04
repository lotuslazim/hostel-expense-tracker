
"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './landing.css';
import { CardSwap, Card } from '@/components/landing/CardSwap';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LandingDesktopPage() {
    const aboutRef = useRef<HTMLDivElement>(null);

    const appFeatures = [
        { name: "Log Meals & Expenses", imageId: "app-dashboard" },
        { name: "Automated Reports", imageId: "app-report" },
        { name: "Track Your Inventory", imageId: "app-inventory" },
        { name: "Community Chat", imageId: "landing-hero" }
    ];

    return (
        <div className="landing-container">
            {/* Top Navigation */}
            <nav className="landing-nav-bar">
                <Link href="/" className="nav-btn">Home</Link>
                <Link href="/about" className="nav-btn">About</Link>
                <Link href="/contact" className="nav-btn">Contact</Link>
            </nav>

            {/* Left Section: Logo and Slogan */}
            <div className="landing-left-section">
                <div className="landing-content-wrapper">
                    <h1 className="landing-logo">BachelorBite</h1>
                    <h3 className="landing-slogan">
                        No notes, no Excel—just one tap, done.
                    </h3>
                </div>
            </div>

            {/* Right Section: Card Animation */}
            <div className="landing-right-section">
                <CardSwap cardDistance={60} verticalDistance={70} delay={4000} pauseOnHover={true}>
                    {appFeatures.map(feature => {
                        const image = PlaceHolderImages.find(p => p.id === feature.imageId);
                        return (
                             <Card key={feature.name}>
                                {image && (
                                    <Image 
                                        src={image.imageUrl} 
                                        alt={feature.name} 
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
