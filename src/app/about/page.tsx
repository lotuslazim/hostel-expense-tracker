
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import './about.css';

export default function AboutPage() {
    const appImage = PlaceHolderImages.find(p => p.id === 'app-preview');

    return (
        <div className="about-page-container">
            <div className="main-card">
                <div className="content-grid">
                    <div className="left-pane">
                        <h2 className="plan-title">FREE TO PLAY</h2>
                        <p className="plan-subtitle">DAILY GAME</p>
                    </div>
                    <div className="center-pane">
                         {appImage && (
                            <Image
                                src={appImage.imageUrl}
                                alt="App Preview"
                                width={300}
                                height={600}
                                className="app-image"
                            />
                        )}
                    </div>
                    <div className="right-pane">
                        <h2 className="plan-title">$3.99 FOR PRO</h2>
                        <ul className="feature-list">
                            <li>UNLIMITED GAMES</li>
                            <li>STATS + BADGES</li>
                            <li>MULTIPLE GAME COLORS</li>
                        </ul>
                    </div>
                </div>
            </div>
            <Link href="/signup" className="cta-button">
                GET STARTED
            </Link>
        </div>
    );
}
