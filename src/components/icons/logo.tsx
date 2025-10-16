
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
        isStacked ? "flex-col" : "",
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
          className="object-contain"
          sizes={mascotSize === 'large' ? "20vw" : "10vw"}
          priority
        />
      </div>
      <div
        className={cn(
           "font-headline font-bold tracking-tight",
           isStacked ? "text-center" : "",
           textSize === 'default' && "text-2xl",
           textSize === 'large' && "text-5xl md:text-6xl",
        )}
      >
        <span className="text-foreground dark:text-white">Bachelor</span>
        <span className="text-primary">Bite</span>
      </div>
    </div>
  );
}
