
"use client";

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

function LinkComponent({ href, children, ...props }: ComponentProps<typeof Link>) {
  return <Link href={href} {...props}>{children}</Link>;
}

export function Logo({ isStacked = false }: { isStacked?: boolean }) {
  return (
    <LinkComponent
      href="/"
      className={cn(
        "flex items-center gap-3", // Increased gap for better spacing
        isStacked && "flex-col"
      )}
      aria-label="BachelorBite Home"
    >
      <div className={cn("shrink-0", isStacked ? "w-20 h-20" : "w-10 h-10")}>
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Sunglasses */}
          <path d="M18 24C18 22.8954 18.8954 22 20 22H44C45.1046 22 46 22.8954 46 24V28C46 29.1046 45.1046 30 44 30H20C18.8954 30 18 29.1046 18 28V24Z" fill="hsl(var(--foreground))" stroke="hsl(var(--foreground))" strokeWidth="1.5"/>
          <path d="M26 30V22" stroke="hsl(var(--background))" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M38 30V22" stroke="hsl(var(--background))" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M46 26H50" stroke="hsl(var(--foreground))" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M18 26H14" stroke="hsl(var(--foreground))" strokeWidth="1.5" strokeLinecap="round"/>

          {/* Alligator Body */}
          <path d="M12 54C12 48.4772 16.4772 44 22 44H42C47.5228 44 52 48.4772 52 54V58H12V54Z" fill="#4CAF50"/>
          {/* Belly */}
          <path d="M22 46C22 45.4477 22.4477 45 23 45H41C41.5523 45 42 45.4477 42 46V58H22V46Z" fill="#F0E68C"/>

          {/* Head */}
          <path d="M14 44V30C14 23.3726 19.3726 18 26 18H38C44.6274 18 50 23.3726 50 30V44H14Z" fill="#4CAF50"/>

          {/* Snout */}
          <path d="M24 44V34C24 32.8954 24.8954 32 26 32H38C39.1046 32 40 32.8954 40 34V44H24Z" fill="#4CAF50"/>
          <path d="M25 41H39" stroke="#388E3C" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      <div className={cn(
        "flex items-baseline",
        isStacked && "flex-col items-center gap-1"
      )}>
        <span className={cn("font-headline font-bold text-foreground", isStacked ? "text-3xl" : "text-xl")}>Bachelor</span>
        <span className={cn("font-headline font-bold text-primary", isStacked ? "text-3xl" : "text-xl")}>Bite</span>
      </div>
    </LinkComponent>
  );
}
