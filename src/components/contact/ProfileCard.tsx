
"use client";

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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
            card.style.setProperty('--pointer-x', `${x / rect.width * 100}%`);
            card.style.setProperty('--pointer-y', `${y / rect.height * 100}%`);
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


    return (
        <div ref={cardRef} className={cn('profile-card', { 'tilt-enabled': shouldEnableTilt })}>
             <div className="card-shine"></div>
            
            {showUserInfo && (
                <div className="card-header-content">
                    <h2>{name}</h2>
                    <p>{title}</p>
                </div>
            )}
            
            <div className="card-avatar-container">
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

            <div className="card-footer-content">
                <div className="footer-user-info">
                    {miniAvatarUrl && (
                         <div className="mini-avatar">
                            <Image
                                src={miniAvatarUrl}
                                alt={`${name}'s mini avatar`}
                                width={40}
                                height={40}
                                className="rounded-full object-cover"
                            />
                        </div>
                    )}
                    <div className="user-details">
                        <p className="handle">@{handle}</p>
                        <p className={`status ${status.toLowerCase()}`}>{status}</p>
                    </div>
                </div>
                <button
                    className="contact-button"
                    onClick={onContactClick}
                    aria-label={`Contact ${name}`}
                >
                    {contactText}
                </button>
            </div>
        </div>
    );
};
