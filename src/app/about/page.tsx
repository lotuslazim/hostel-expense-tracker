
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import './about.css';
import { LandingHeader } from '@/components/app/landing-header';
import { CheckCircle, Users, ArrowRight } from 'lucide-react';

const features = [
    {
        id: 'planner',
        title: 'Effortless Meal & Expense Logging',
        description: 'Log daily meals and shared expenses in just a few taps. We handle the math, so you don’t have to.',
        image: PlaceHolderImages.find(p => p.id === 'app-dashboard'),
    },
    {
        id: 'tracker',
        title: 'Automated Monthly Settlements',
        description: 'Receive a clear, automated report at the end of each month. See who owes what and who gets paid back instantly.',
        image: PlaceHolderImages.find(p => p.id === 'app-report'),
    },
    {
        id: 'inventory',
        title: 'Shared Inventory Tracking',
        description: 'Groceries and food items are automatically added to a shared inventory, so everyone knows what’s in stock.',
        image: PlaceHolderImages.find(p => p.id === 'app-inventory'),
    },
];

const howItWorksSteps = [
    {
        step: 1,
        title: 'Create or Join a Group',
        description: 'Start a group with your roommates or join an existing one with an invite code.',
    },
    {
        step: 2,
        title: 'Log Daily Activity',
        description: 'Log your meals and any shared expenses as they happen throughout the month.',
    },
    {
        step: 3,
        title: 'Settle Up Automatically',
        description: 'At the end of the month, view the auto-generated report and settle the balances.',
    },
];

export default function AboutPage() {
    return (
        <div className="about-page-wrapper">
            <header className="about-header-fixed">
                <LandingHeader />
            </header>

            <main className="about-main-content">
                {/* Hero Section */}
                <section className="about-hero-section">
                    <div className="about-hero-content">
                        <h1 className="about-hero-headline">Our Story</h1>
                        <p className="about-hero-subheading">
                            BachelorBite was born from the chaos of shared living. We got tired of messy spreadsheets and endless group chat debates about who bought the milk. So, we built a simple, smart solution to make roommate life easier for everyone.
                        </p>
                    </div>
                </section>

                {/* Features Section */}
                <section className="about-features-section">
                    <h2 className="section-title">Everything You Need, Nothing You Don’t</h2>
                    <div className="features-grid">
                        {features.map(feature => (
                            <div key={feature.id} className="feature-card">
                                {feature.image && (
                                    <div className="feature-card-image">
                                        <Image
                                            src={feature.image.imageUrl}
                                            alt={feature.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <div className="feature-card-content">
                                    <h3 className="feature-card-title">{feature.title}</h3>
                                    <p className="feature-card-description">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                
                {/* How It Works Section */}
                <section className="about-how-it-works-section">
                     <h2 className="section-title">How It Works</h2>
                     <div className="how-it-works-grid">
                        {howItWorksSteps.map(step => (
                            <div key={step.step} className="how-it-works-card">
                                <div className="how-it-works-step-number">0{step.step}</div>
                                <h3 className="how-it-works-title">{step.title}</h3>
                                <p className="how-it-works-description">{step.description}</p>
                            </div>
                        ))}
                     </div>
                </section>

                {/* Values/Trust Section */}
                <section className="about-values-section">
                     <h2 className="section-title">Built on Trust & Simplicity</h2>
                     <div className="values-grid">
                        <div className="value-item">
                            <Users className="value-icon"/>
                            <p>Focus on what matters—community and harmony.</p>
                        </div>
                         <div className="value-item">
                            <CheckCircle className="value-icon"/>
                            <p>An intuitive interface that anyone can master in minutes.</p>
                        </div>
                     </div>
                </section>

                 {/* CTA Section */}
                <section className="about-cta-section">
                    <div className="cta-card">
                        <h2 className="cta-title">Ready to Simplify Your Shared Living?</h2>
                        <p className="cta-description">Get started for free. No credit card required.</p>
                        <Link href="/signup" className="cta-button-main">
                            Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
