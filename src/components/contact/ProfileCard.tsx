"use client";

import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { gsap } from "gsap";

interface ProfileCardProps {
    name: string;
    title: string;
    handle: string;
    status: string;
    avatarUrl?: string;
    miniAvatarUrl?: string;
    contactText: string;
    showUserInfo?: boolean;
    enableTilt?: boolean;
    enableMobileTilt?: boolean;
    onContactClick: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
    name,
    title,
    handle,
    status,
    avatarUrl,
    miniAvatarUrl,
    contactText,
    showUserInfo = true,
    enableTilt = true,
    enableMobileTilt = false,
    onContactClick,
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const shouldEnableTilt = (enableTilt && !isMobile) || (enableMobileTilt && isMobile);

    useEffect(() => {
        const card = cardRef.current;
        if (!card || !shouldEnableTilt) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--pointer-x', `${x}px`);
            card.style.setProperty('--pointer-y', `${y}px`);
        };

        const handleMouseLeave = () => {
            card.style.removeProperty('--pointer-x');
            card.style.removeProperty('--pointer-y');
        };

        card.addEventListener('mousemove', handleMouseMove);
        card.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            card.removeEventListener('mousemove', handleMouseMove);
            card.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [shouldEnableTilt]);

    useLayoutEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(card,
                { opacity: 0, scale: 0.9, y: 50 },
                { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "power3.out" }
            );
        }, card);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={cardRef} className={cn('profile-card', { 'tilt-enabled': shouldEnableTilt })}>
            <div className="card-shine"></div>
            <div className="card-glare"></div>
            <div className="card-background"></div>
            
            <div className="card-content">
                {showUserInfo && (
                    <>
                        <div className="user-info">
                            <div className="name-title">
                                <h2>{name}</h2>
                                <p>{title}</p>
                            </div>
                            <div className="handle-status">
                                <span className="handle">@{handle}</span>
                                <span className={`status ${status.toLowerCase()}`}>{status}</span>
                            </div>
                        </div>
                        <div className="mini-avatar">
                            {miniAvatarUrl && (
                                <Image
                                    src={miniAvatarUrl}
                                    alt={`${name}'s mini avatar`}
                                    width={24}
                                    height={24}
                                    className="rounded-full object-cover"
                                />
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className="card-avatar">
                {avatarUrl && (
                    <Image
                        src={avatarUrl}
                        alt={`${name}'s avatar`}
                        fill
                        className="object-cover"
                        priority
                    />
                )}
            </div>

            <button
                className="contact-button"
                onClick={onContactClick}
                aria-label={`Contact ${name}`}
            >
                {contactText}
            </button>
        </div>
    );
};
