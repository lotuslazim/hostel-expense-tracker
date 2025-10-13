
"use client";

import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LogoProps {
  isStacked?: boolean;
  isMascotAnimated?: boolean;
  mascotSize?: 'default' | 'large';
  className?: string;
  textSize?: 'default' | 'large';
}

export function Logo({ 
  isStacked = false, 
  isMascotAnimated = false, 
  mascotSize = 'default',
  textSize = 'default',
  className
}: LogoProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-0 group",
        isStacked ? "flex-col" : "gap-1.5",
        className
      )}
      aria-label="BachelorBite Home"
    >
      <div className={cn(
          "relative shrink-0 transition-transform duration-300 group-hover:scale-110",
          mascotSize === 'default' && (isStacked ? "w-20 h-12 mb-2" : "w-10 h-10"),
          mascotSize === 'large' && 'w-24 h-24 md:w-28 md:h-28',
          isMascotAnimated && 'animate-mascot-idle'
        )}>
        <Image 
          src="/logo.png" 
          alt="BachelorBite Logo" 
          fill
          style={{ objectFit: "contain" }}
          sizes={mascotSize === 'large' ? "20vw" : "10vw"}
          priority
        />
      </div>
      <div
        className={cn(
           "font-headline font-bold tracking-tight",
           "text-primary-foreground group-[.dark-theme-logo]:text-white",
           isStacked ? "text-center" : "",
           textSize === 'default' && "text-2xl",
           textSize === 'large' && "text-5xl md:text-6xl",
        )}
      >
        <span className="text-white group-[.light-theme-logo]:text-foreground">Bachelor</span>
        <span className="text-primary">Bite</span>
      </div>
    </div>
  );
}
