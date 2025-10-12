
"use client";

import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ isStacked = false }: { isStacked?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-0 group", // Added group for hover effects
        isStacked ? "flex-col" : ""
      )}
      aria-label="BachelorBite Home"
    >
      <div className={cn(
          "relative shrink-0 animate-logo-pulse transition-transform duration-300 group-hover:scale-110", // Added hover effect
          isStacked ? "w-20 h-12 mb-2" : "w-12 h-12"
        )}>
        <Image 
          src="/logo.png" 
          alt="BachelorBite Logo" 
          fill
          style={{ objectFit: "contain" }}
          sizes="(max-width: 768px) 10vw, 5vw"
          priority
        />
      </div>
      <div
        className={cn(
          "font-headline text-2xl font-bold tracking-tight",
          isStacked ? "text-center" : ""
        )}
      >
        <span className="text-foreground group-[.dark-theme-logo]:text-white">Bachelor</span>
        <span style={{ color: '#84B067' }}>Bite</span>
      </div>
    </div>
  );
}
