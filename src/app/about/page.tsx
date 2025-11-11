
"use client";

import { useState, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { wrap } from '@popmotion/popcorn';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Utensils, Wheat, CheckCircle, Leaf, Home, ChevronsRight } from 'lucide-react';
import { gsap } from "gsap";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import './about.css';

const appFeatures = [
    { name: "Log Meals & Expenses", description: "Quickly log your daily meals and any shared expenses. It’s that simple.", imageId: "app-dashboard" },
    { name: "Automated Reports", description: "Get a detailed report with a final settlement, all calculated automatically.", imageId: "app-report" },
    { name: "Track Your Inventory", description: "Groceries are automatically added to a monthly inventory list from your expenses.", imageId: "app-inventory" },
    { name: "Community Chat", description: "Connect with your flatmates, share updates, and coordinate easily.", imageId: "landing-hero" }
];

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0,
        scale: 0.8,
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        scale: 1,
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 300 : -300,
        opacity: 0,
        scale: 0.8,
    }),
};

const textVariants = {
    enter: { opacity: 0, y: 10 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
};

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
        { Icon: Leaf, size: "w-7 h-7", top: "50%", left: "5%" },
        { Icon: Home, size: "w-9 h-9", top: "80%", left: "50%" },
    ];
  
    return (
      <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden">
        {elements.map((el, i) => (
          <div
            key={i}
            className={`floating-element-about absolute ${el.size}`}
            style={{ top: el.top, left: el.left }}
          >
            <el.Icon strokeWidth={1.5}/>
          </div>
        ))}
      </div>
    );
};

export default function AboutPage() {
    const [[page, direction], setPage] = useState([0, 0]);

    const featureIndex = wrap(0, appFeatures.length, page);

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    };

    const currentFeature = appFeatures[featureIndex];
    const image = PlaceHolderImages.find(p => p.id === currentFeature.imageId);

    return (
        <div className="about-section yellow-gradient-bg text-slate-800">
            <div className="absolute inset-0 z-0 bg-retro-pattern opacity-10"></div>
            <FloatingElements />
            
            <div className="about-container">
                <div className="about-carousel-wrapper">
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={page}
                            className="carousel-card"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 },
                            }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={1}
                            onDragEnd={(e, { offset, velocity }) => {
                                const swipe = Math.abs(offset.x);
                                if (swipe > 50) {
                                    paginate(offset.x > 0 ? -1 : 1);
                                }
                            }}
                        >
                            {image && <Image src={image.imageUrl} alt={currentFeature.name} fill sizes="50vw" className="card-image" />}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="feature-info-container">
                     <AnimatePresence mode="wait">
                        <motion.div
                            key={currentFeature.name}
                            variants={textVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                            className="feature-info-box"
                        >
                            <h2 className="feature-name">{currentFeature.name}</h2>
                            <p className="feature-description">{currentFeature.description}</p>
                        </motion.div>
                    </AnimatePresence>

                    <div className="carousel-navigation">
                        <button className="nav-arrow" onClick={() => paginate(-1)} aria-label="Previous feature" disabled={page === 0}>
                            <ArrowLeft />
                        </button>
                        <div className="progress-indicator">
                            {appFeatures.map((_, i) => (
                                <div
                                    key={i}
                                    className={`progress-dot ${i === featureIndex ? 'active' : ''}`}
                                />
                            ))}
                        </div>
                        <button className="nav-arrow" onClick={() => paginate(1)} aria-label="Next feature" disabled={page === appFeatures.length - 1}>
                            <ArrowRight />
                        </button>
                    </div>
                </div>
            </div>

            <Link href="/contact" className="next-page-btn">
                <span>Next</span>
                <ChevronsRight size={20} />
            </Link>
        </div>
    );
}
