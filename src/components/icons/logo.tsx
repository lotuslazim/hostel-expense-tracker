
"use client";

import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LogoProps {
  isStacked?: boolean;
  isMascotAnimated?: boolean;
  mascotSize?: 'default' | 'large';
  className?: string;
}

export function Logo({ 
  isStacked = false, 
  isMascotAnimated = false, 
  mascotSize = 'default',
  className
}: LogoProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-0 group",
        isStacked ? "flex-col" : "",
        className
      )}
      aria-label="BachelorBite Home"
    >
      <div className={cn(
          "relative shrink-0 transition-transform duration-300 group-hover:scale-110",
          isStacked ? "w-20 h-12 mb-2" : "w-12 h-12",
          mascotSize === 'large' && 'w-16 h-16 md:w-20 md:h-20',
          isMascotAnimated && 'animate-mascot-idle'
        )}>
        <Image 
          src="/logo.png" 
          alt="BachelorBite Logo" 
          fill
          style={{ objectFit: "contain" }}
          sizes={mascotSize === 'large' ? "20vw" : "(max-width: 768px) 10vw, 5vw"}
          priority
        />
      </div>
      <div
        className={cn(
          "font-headline text-2xl font-bold tracking-tight",
           "group-[.dark-theme-logo]:text-white",
          isStacked ? "text-center" : ""
        )}
      >
        <span className="text-foreground group-[.dark-theme-logo]:text-white">Bachelor</span>
        <span style={{ color: '#84B067' }}>Bite</span>
      </div>
    </div>
  );
}
