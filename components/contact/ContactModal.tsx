
"use client";

import React from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { FaLinkedin, FaGithub, FaEnvelope } from 'react-icons/fa';
import { X } from 'lucide-react';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const profileImage = PlaceHolderImages.find(p => p.id === 'user-avatar');

    const socialLinks = [
        {
            icon: <FaEnvelope className="icon" />,
            text: "lotuslazim@gmail.com",
            href: "mailto:lotuslazim@gmail.com"
        },
        {
            icon: <FaLinkedin className="icon" />,
            text: "LinkedIn",
            href: "https://www.linkedin.com/in/lotus-lazim-65b8a1248"
        },
        {
            icon: <FaGithub className="icon" />,
            text: "GitHub",
            href: "https://github.com/lotuslazim"
        }
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="modal-close-button">
                    <X size={20} />
                </button>

                {profileImage && (
                    <Image
                        src={profileImage.imageUrl}
                        alt="Lotus Lazim"
                        width={100}
                        height={100}
                        className="modal-avatar"
                    />
                )}

                <h2 className="modal-name">Lotus Lazim</h2>
                <p className="modal-title">4th Year CSE Student, BRAC University</p>

                <div className="modal-links">
                    {socialLinks.map((link, index) => (
                        <a key={index} href={link.href} target="_blank" rel="noopener noreferrer" className="modal-link">
                            {link.icon}
                            <span>{link.text}</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};
