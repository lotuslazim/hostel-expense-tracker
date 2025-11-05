
"use client";

import React from 'react';
import Link from 'next/link';
import { LandingHeader } from '@/components/app/landing-header';
import Image from 'next/image';
import { ArrowRight, CheckCircle, Wheat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { cn } from '@/lib/utils';
import { SplitText } from '@/components/animation/SplitText';
import { useFontLoader } from '@/lib/hooks/use-font-loader';

const FloatingIcon = ({ icon: Icon, className, style }: { icon: React.ComponentType<{className?: string}>, className: string, style: React.CSSProperties }) => {
    return (
        <div className={cn("floating-element", className)} style={style}>
            <Icon />
        </div>
    );
};

const Psymbol = ({ className }: { className?: string }) => (
    <svg className={className} width="41" height="41" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25.4049 34.2559C23.4141 34.2559 21.5518 33.7256 19.8179 32.665C18.084 31.6045 16.6387 30.1323 15.4819 28.2485C14.3252 26.3647 13.7468 24.2163 13.7468 21.8032V1H21.3191V21.8032C21.3191 22.8105 21.5518 23.6426 22.017 24.2993C22.4822 24.9561 23.1633 25.2845 24.0603 25.2845C24.8289 25.2845 25.4526 25.0193 25.9314 24.489C26.4103 23.9587 26.6497 23.2126 26.6497 22.2505V1H34.222V22.2505C34.222 24.6091 33.6436 26.7031 32.4868 28.5325C31.3301 30.3618 29.8386 31.7915 27.9941 32.8213C26.1496 33.8511 24.1206 34.366 21.9072 34.366H20.4891V41H25.4049V34.2559Z" fill="black" fillOpacity="0.1"/>
    </svg>
)

export default function LandingPage() {
    const areFontsLoaded = useFontLoader();

    return (
        <div className={cn("landing-page-container new-landing-style", !areFontsLoaded && 'opacity-0')}>
            <div className="wavy-bg"></div>
            <LandingHeader />

            <main className="landing-content">
                <FloatingIcon icon={Psymbol} className="w-8 h-8 top-[15%] left-[10%]" style={{ animationDelay: '0.5s' }} />
                <FloatingIcon icon={Wheat} className="w-7 h-7 text-black/10 top-[20%] right-[15%]" style={{ animationDelay: '1s' }} />
                <FloatingIcon icon={Psymbol} className="w-10 h-10 bottom-[15%] right-[10%]" style={{ animationDelay: '1.5s' }} />
                <FloatingIcon icon={CheckCircle} className="w-6 h-6 text-black/10 bottom-[25%] left-[15%]" style={{ animationDelay: '2s' }} />

                <div className="content-wrapper">
                    <SplitText
                        as="p"
                        text="Meet the"
                        className="meet-the-text"
                        initial={{ y: 20, opacity: 0 }}
                    />
                    
                    <h1 className="landing-headline">
                        <SplitText as="span" text="Bachelor" initial={{ y: 20, opacity: 0 }}/>
                        <SplitText as="span" text="Bite." className="text-secondary" initial={{ y: 20, opacity: 0 }}/>
                    </h1>
                    
                    <SplitText
                        as="p"
                        text="No notes, no Excel—just one tap, done."
                        className="tagline"
                        initial={{ y: 20, opacity: 0 }}
                    />

                    <div className="mascot-container">
                        <div className="mascot-shadow"></div>
                        <Image
                            src="/mascot.png"
                            alt="BachelorBite Mascot"
                            width={280}
                            height={280}
                            className="mascot-image"
                            priority
                        />
                    </div>

                    <div className="actions">
                        <Link href="/signup" passHref>
                             <Button asChild className="get-started-btn">
                                <a>
                                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                                </a>
                            </Button>
                        </Link>
                         <Link href="/login" passHref>
                            <div className="login-icon-wrapper">N</div>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

