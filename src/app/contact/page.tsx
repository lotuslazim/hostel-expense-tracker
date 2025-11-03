
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
    handle: "lotuslazim",
    avatar: PlaceHolderImages.find(p => p.id === 'user-avatar'),
    miniAvatar: PlaceHolderImages.find(p => p.id === 'user-avatar'),
  };

  return (
    <div className="contact-page-container">
        <LandingHeader />

        <div className="vertical-auth-buttons">
            <Link href="/signup" className="vertical-auth-btn">
                <UserPlus className="h-5 w-5 mr-2" /> Sign Up
            </Link>
            <Link href="/login" className="vertical-auth-btn login">
                <LogIn className="h-5 w-5 mr-2" /> Log In
            </Link>
        </div>

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
        </div>
        <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

    