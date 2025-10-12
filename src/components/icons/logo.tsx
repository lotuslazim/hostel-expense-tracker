"use client";

import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';
import Image from 'next/image';

export function Logo({ isStacked = false }: { isStacked?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-0",
        isStacked ? "flex-col" : ""
      )}
      aria-label="BachelorBite Home"
    >
      <div className={cn("relative shrink-0", isStacked ? "w-20 h-12" : "w-12 h-12")}>
        <Image 
          src="/logo.png" 
          alt="BachelorBite Logo" 
          fill
          style={{ objectFit: "contain" }}
          sizes="(max-width: 768px) 10vw, 5vw"
        />
      </div>
      <div
        className={cn(
          "font-headline text-2xl font-bold tracking-tight",
          isStacked ? "text-center" : ""
        )}
      >
        <span className="text-foreground">Bachelor</span>
        <span className="text-primary">Bite</span>
      </div>
    </div>
  );
}
