
"use client";

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';
import Image from 'next/image';

// Using a custom LinkComponent to handle Next.js Link props
function LinkComponent({ href, children, ...props }: ComponentProps<typeof Link>)
{
  return <Link href={href} {...props}>{children}</Link>;
}


export function Logo({ isStacked = false }: { isStacked?: boolean }) {
  return (
    <LinkComponent 
      href="/" 
      className={cn(
        "flex items-center gap-2",
        isStacked && "flex-col"
      )} 
      aria-label="BachelorBite Home"
    >
      {/* 
        To use your own logo:
        1. Add your logo image (e.g., logo.png) to the `public` folder.
        2. Update the `src` attribute below to point to your file (e.g., src="/logo.png").
        3. Adjust the width and height to match your logo's aspect ratio.
      */}
      <Image
        src="/logo.png" // Assumes your logo is named logo.png in the /public folder
        alt="BachelorBite Logo"
        width={isStacked ? 80 : 40}
        height={isStacked ? 80 : 40}
        className="shrink-0"
        unoptimized // Necessary for static export
      />
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
