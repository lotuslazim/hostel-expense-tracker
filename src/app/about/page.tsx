"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import './about.css';
import { LandingHeader } from '@/components/app/landing-header';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const features = [
    {
        id: 'chat',
        title: 'Group Chat',
        description: 'Chat and coordinate with your roommates in real time.',
        image: PlaceHolderImages.find(p => p.id === 'app-chat-screen'),
    },
    {
        id: 'planner',
        title: 'Meal Planner',
        description: 'Log who’s eating and reduce food waste.',
        image: PlaceHolderImages.find(p => p.id === 'app-meal-planner-screen'),
    },
    {
        id: 'tracker',
        title: 'Expense Tracker',
        description: 'Split and manage all your bills easily.',
        image: PlaceHolderImages.find(p => p.id === 'app-expense-tracker-screen'),
    },
    {
        id: 'leaderboard',
        title: 'Leaderboard',
        description: 'Earn badges and see who’s most active.',
        image: PlaceHolderImages.find(p => p.id === 'app-leaderboard-screen'),
    },
];

const textVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 50 : -50,
    opacity: 0,
  }),
};

const imageVariants = {
  enter: { opacity: 0, scale: 0.95 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};


export default function AboutPage() {
    const [[page, direction], setPage] = useState([0, 0]);

    const paginate = (newDirection: number) => {
        setPage([(page + newDirection + features.length) % features.length, newDirection]);
    };
    
    const currentFeature = features[page];
    
    return (
        <div className="about-page-container">
            <header className="about-header">
                <LandingHeader />
            </header>
            <div className="main-card">
                <div className="content-grid">
                    <div className="arrow-nav left-arrow">
                        <button onClick={() => paginate(-1)}>
                            <ChevronLeft size={36} />
                        </button>
                    </div>

                    <div className="feature-pane">
                         <AnimatePresence initial={false} custom={direction}>
                            <motion.div
                                key={page}
                                className="feature-text"
                                custom={direction}
                                variants={textVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: 'spring', stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 },
                                }}
                            >
                                <h2 className="plan-title">{currentFeature.title}</h2>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="center-pane">
                         <div className="phone-mockup">
                             <AnimatePresence initial={false}>
                                <motion.div
                                    key={page}
                                    className="app-image-container"
                                    variants={imageVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                >
                                    {currentFeature.image && (
                                        <Image
                                            src={currentFeature.image.imageUrl}
                                            alt={currentFeature.title}
                                            width={300}
                                            height={600}
                                            className="app-image"
                                        />
                                    )}
                                </motion.div>
                             </AnimatePresence>
                        </div>
                    </div>
                    <div className="feature-pane">
                        <AnimatePresence initial={false} custom={direction}>
                             <motion.div
                                key={page}
                                className="feature-text"
                                custom={direction}
                                variants={textVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: 'spring', stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 },
                                }}
                            >
                                <p className="feature-description">{currentFeature.description}</p>
                             </motion.div>
                        </AnimatePresence>
                    </div>
                    
                    <div className="arrow-nav right-arrow">
                         <button onClick={() => paginate(1)}>
                            <ChevronRight size={36} />
                        </button>
                    </div>
                </div>
            </div>
            <Link href="/contact" className="cta-button">
                NEXT
            </Link>
        </div>
    );
}
