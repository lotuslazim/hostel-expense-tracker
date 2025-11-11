
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ProfileCard } from '@/components/contact/ProfileCard';
import { ContactModal } from '@/components/contact/ContactModal';
import './contact.css';
import { LandingHeader } from '@/components/app/landing-header';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LogIn, UserPlus } from 'lucide-react';

export default function ContactPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const user1 = {
    name: "Lotus Lazim",
    title: "Software Engineer",
    handle: "javicodes",
    avatar: PlaceHolderImages.find(p => p.id === 'user-avatar'),
    miniAvatar: PlaceHolderImages.find(p => p.id === 'user-avatar'),
  };

  return (
    <div className="contact-page-container">
        
        <div className="contact-page-content">
            <div className="profile-cards-wrapper">
                <ProfileCard
                    name={user1.name}
                    title={user1.title}
                    handle={user1.handle}
                    status="Online"
                    avatarUrl={user1.avatar?.imageUrl}
                    miniAvatarUrl={user1.miniAvatar?.imageUrl}
                    contactText="Contact Me"
                    showUserInfo={true}
                    enableTilt={true}
                    onContactClick={() => setIsModalOpen(true)}
                />
            </div>
             <div className="vertical-auth-buttons">
                <Link href="/signup" className="vertical-auth-btn signup" title="Sign Up">
                    <UserPlus className="h-5 w-5 icon-anim" />
                    <span className="button-text">Sign Up</span>
                </Link>
                <Link href="/login" className="vertical-auth-btn login" title="Log In">
                    <LogIn className="h-5 w-5 icon-anim" />
                    <span className="button-text">Log In</span>
                </Link>
            </div>
            <Link href="/signup" className="cta-button">
                NEXT
            </Link>
        </div>
        <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
