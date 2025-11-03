
"use client";

import React from 'react';
import { ProfileCard } from '@/components/contact/ProfileCard';
import './contact.css';
import { LandingHeader } from '@/components/app/landing-header';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function ContactPage() {
  const handleContactClick = (name: string) => {
    console.log(`Contact clicked for ${name}`);
  };

  const user1 = {
    name: "Javi A. Torres",
    title: "Software Engineer",
    handle: "javicodes",
    avatar: PlaceHolderImages.find(p => p.id === 'user-avatar'),
    miniAvatar: PlaceHolderImages.find(p => p.id === 'user-avatar'),
  };

  const user2 = {
    name: "Jane Doe",
    title: "UI/UX Designer",
    handle: "janedesigns",
    avatar: PlaceHolderImages.find(p => p.id === 'user-avatar-2'),
    miniAvatar: PlaceHolderImages.find(p => p.id === 'user-avatar-2'),
  };

  return (
    <div className="contact-page-container">
        <LandingHeader />
        <div className="contact-page-content">
            <h1 className="contact-title">Meet the Team</h1>
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
                    onContactClick={() => handleContactClick(user1.name)}
                />
                <ProfileCard
                    name={user2.name}
                    title={user2.title}
                    handle={user2.handle}
                    status="Online"
                    avatarUrl={user2.avatar?.imageUrl}
                    miniAvatarUrl={user2.miniAvatar?.imageUrl}
                    contactText="Get In Touch"
                    showUserInfo={true}
                    enableTilt={true}
                    onContactClick={() => handleContactClick(user2.name)}
                />
            </div>
        </div>
    </div>
  );
};
