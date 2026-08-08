
"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import './about.css';
import { LandingHeader } from '@/components/app/landing-header';
import { CheckCircle, Users, ArrowRight, HeartHandshake, Bot, ShieldCheck } from 'lucide-react';
import { MobilePreviewCard } from '@/components/landing/MobilePreviewCard';

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
        description: 'Start a group with your roommates or join an existing one with a unique invite code.',
        letter: 'C',
    },
    {
        step: 2,
        title: 'Log Daily Activity',
        description: 'Simply log your meals and any shared expenses as they happen throughout the month.',
        letter: 'L',
    },
    {
        step: 3,
        title: 'Settle Up Automatically',
        description: 'At the end of the month, view the auto-generated report and settle balances in a single click.',
        letter: 'S',
    },
];

const values = [
    {
        icon: HeartHandshake,
        title: "Community First",
        description: "We believe technology should bring people together, not create distance. BachelorBite is designed to foster harmony and reduce friction in shared living spaces."
    },
    {
        icon: Bot,
        title: "Smart Automation",
        description: "From calculating meal rates to settling monthly balances, we automate the tedious tasks so you can focus on what matters—enjoying your time with your flatmates."
    },
    {
        icon: ShieldCheck,
        title: "Trust & Privacy",
        description: "Your data is yours. We are committed to ensuring your financial and personal information is secure, private, and never shared."
    }
];

export default function AboutPage() {
    const sectionsRef = useRef<Array<HTMLElement | null>>([]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        sectionsRef.current.forEach((section) => {
            if (section) {
                observer.observe(section);
            }
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="about-page-wrapper">
            <header className="about-header-fixed">
                <LandingHeader />
            </header>

            <main className="about-main-content">
                {/* Hero Section */}
                <section
                    ref={(el) => {
                        sectionsRef.current[0] = el;
                    }}
                    className="about-section about-hero-section is-visible"
                >
                    <div className="hero-box">
                        <div className="hero-text-left">
                            <h1 className="about-hero-headline">Our Story</h1>
                        </div>
                        <div className="hero-phone-container">
                            <div className="iphone-mockup">
                                <div className="iphone-frame">
                                    <div className="iphone-screen">
                                        <MobilePreviewCard />
                                    </div>
                                    <div className="iphone-notch"></div>
                                </div>
                            </div>
                        </div>
                        <div className="hero-text-right">
                             <p className="about-hero-subheading">
                                BachelorBite was born from the chaos of shared living. We got tired of messy spreadsheets and endless group chat debates about who bought the milk.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section
                    ref={(el) => {
                        sectionsRef.current[1] = el;
                    }}
                    className="about-section"
                >
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
                <section
                    ref={(el) => {
                        sectionsRef.current[2] = el;
                    }}
                    className="about-section how-it-works-section"
                >
                    <span id="bg-text-1" className="bg-text">01</span>
                    <span id="bg-text-2" className="bg-text">02</span>
                    <span id="bg-text-3" className="bg-text">03</span>
                    <h2 className="section-title">How does it work?</h2>
                    <div className="how-it-works-grid">
                        {howItWorksSteps.map((step, index) => (
                            <div key={step.step} className={`how-it-works-card ${index === 1 ? 'is-light' : ''}`}>
                                <div className="how-it-works-visual">
                                    <div className="step-row">
                                        <span className="step-letter">{step.letter}</span>
                                        <span>- - - -</span>
                                    </div>
                                </div>
                                <div className="how-it-works-text">
                                    <p className="how-to-play">Step {step.step}</p>
                                    <h3 className="main-desc">{step.title}</h3>
                                    <p className="sub-desc">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Values Section */}
                <section
                    ref={(el) => {
                        sectionsRef.current[3] = el;
                    }}
                    className="about-section"
                >
                    <h2 className="section-title">Our Core Values</h2>
                    <div className="values-grid">
                        {values.map(value => (
                            <div key={value.title} className="value-item">
                                <value.icon className="value-icon"/>
                                <h3 className="feature-card-title">{value.title}</h3>
                                <p className="feature-card-description">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA Section */}
                <section
                    ref={(el) => {
                        sectionsRef.current[4] = el;
                    }}
                    className="about-section about-cta-section"
                >
                    <h2 className="cta-title">Ready to Simplify Your Shared Living?</h2>
                    <p className="cta-description">Get started for free. No credit card required.</p>
                    <Link href="/signup" className="cta-button-main">
                        Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </section>
            </main>
        </div>
    );
}
