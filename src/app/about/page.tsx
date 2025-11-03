
"use client";

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import './about.css';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { ArrowUp, ArrowDown, Utensils, Wheat, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { LandingHeader } from '@/components/app/landing-header';
import { gsap } from "gsap";

const appFeatures = [
    { name: "Log Meals & Expenses", description: "Quickly log your daily meals and any shared expenses. It’s that simple.", imageId: "app-dashboard" },
    { name: "Automated Reports", description: "Get a detailed report with a final settlement, all calculated automatically.", imageId: "app-report" },
    { name: "Track Your Inventory", description: "Groceries are automatically added to a monthly inventory list from your expenses.", imageId: "app-inventory" },
    { name: "Community Chat", description: "Connect with your flatmates, share updates, and coordinate easily.", imageId: "landing-hero" }
];

const FloatingElements = () => {
    const containerRef = useRef<HTMLDivElement>(null);
  
    useLayoutEffect(() => {
      const ctx = gsap.context(() => {
        const elements = gsap.utils.toArray(".floating-element-about");
        elements.forEach((el: any) => {
          gsap.to(el, {
            y: 'random(-20, 20)',
            x: 'random(-10, 10)',
            duration: 'random(5, 8)',
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });
        });
      }, containerRef);
  
      return () => ctx.revert();
    }, []);
  
    const elements = [
        { Icon: Utensils, size: "w-8 h-8", top: "15%", left: "10%" },
        { Icon: Wheat, size: "w-6 h-6", top: "25%", left: "80%" },
        { Icon: CheckCircle, size: "w-6 h-6", top: "70%", left: "20%" },
        { Icon: Utensils, size: "w-10 h-10", top: "85%", left: "90%" },
    ];
  
    return (
      <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden">
        {elements.map((el, i) => (
          <div
            key={i}
            className={`floating-element-about absolute ${el.size} text-white opacity-80 filter drop-shadow-lg`}
            style={{ top: el.top, left: el.left }}
          >
            <el.Icon strokeWidth={1.5}/>
          </div>
        ))}
      </div>
    );
};


export default function AboutPage() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const carouselRef = useRef<HTMLDivElement>(null);

    const updateCarousel = useCallback((newIndex: number) => {
        if (isAnimating) return;

        const clampedIndex = (newIndex + appFeatures.length) % appFeatures.length;
        
        setIsAnimating(true);
        setCurrentIndex(clampedIndex);

        setTimeout(() => {
            setIsAnimating(false);
        }, 600); // Animation duration
    }, [isAnimating]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowUp") updateCarousel(currentIndex - 1);
            if (e.key === "ArrowDown") updateCarousel(currentIndex + 1);
        };

        let touchStartY = 0;
        let touchEndY = 0;

        const handleTouchStart = (e: TouchEvent) => {
            touchStartY = e.changedTouches[0].screenY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        };

        const handleSwipe = () => {
            const swipeThreshold = 50;
            const diff = touchStartY - touchEndY;
            if (Math.abs(diff) > swipeThreshold) {
                diff > 0 ? updateCarousel(currentIndex + 1) : updateCarousel(currentIndex - 1);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        const carouselElement = carouselRef.current;
        carouselElement?.addEventListener("touchstart", handleTouchStart);
        carouselElement?.addEventListener("touchend", handleTouchEnd);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            carouselElement?.removeEventListener("touchstart", handleTouchStart);
            carouselElement?.removeEventListener("touchend", handleTouchEnd);
        };
    }, [currentIndex, updateCarousel]);
    
    const getCardClass = (index: number) => {
        const offset = (index - currentIndex + appFeatures.length) % appFeatures.length;
        if (offset === 0) return "center";
        if (offset === 1) return "down-1";
        if (offset === 2) return "down-2";
        if (offset === appFeatures.length - 1) return "up-1";
        if (offset === appFeatures.length - 2) return "up-2";
        return "hidden";
    };

    const currentFeature = appFeatures[currentIndex];

    return (
        <div className="about-section yellow-gradient-bg text-slate-800">
            <div className="absolute inset-0 z-0 bg-retro-pattern"></div>
            <FloatingElements />
            <LandingHeader />
            <div className="about-container" style={{ position: 'relative', zIndex: 10 }}>
                <div className="about-carousel" ref={carouselRef}>
                    <button className="nav-arrow up" aria-label="Previous feature" onClick={() => updateCarousel(currentIndex - 1)}><ArrowUp /></button>
                    <div className="carousel-cards">
                        {appFeatures.map((feature, i) => {
                            const image = PlaceHolderImages.find(p => p.id === feature.imageId);
                            return (
                                <div key={feature.name} className={`card ${getCardClass(i)}`} onClick={() => updateCarousel(i)}>
                                     {image && <Image src={image.imageUrl} alt={feature.name} fill className="card-image" />}
                                </div>
                            );
                        })}
                    </div>
                    <button className="nav-arrow down" aria-label="Next feature" onClick={() => updateCarousel(currentIndex + 1)}><ArrowDown /></button>
                </div>

                <div className="carousel-dots">
                    {appFeatures.map((_, i) => (
                        <div key={i} className={`dot ${i === currentIndex ? 'active' : ''}`} onClick={() => updateCarousel(i)}></div>
                    ))}
                </div>

                <div className="feature-info">
                    <h2 className="feature-name">{currentFeature.name}</h2>
                    <p className="feature-description">{currentFeature.description}</p>
                </div>
            </div>

            <Link href="https://bachelorpoint.com" target="_blank" rel="noopener noreferrer" className="floating-website-btn">
                Visit Our Website
            </Link>
        </div>
    );
}
