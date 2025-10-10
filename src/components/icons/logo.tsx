
"use client";

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';
import Image from 'next/image';

function LinkComponent({ href, children, ...props }: ComponentProps<typeof Link>) {
  return <Link href={href} {...props}>{children}</Link>;
}

export function Logo({ isStacked = false }: { isStacked?: boolean }) {
  return (
    <LinkComponent
      href="/"
      className={cn(
        "flex items-center gap-3",
        isStacked && "flex-col"
      )}
      aria-label="BachelorBite Home"
    >
      <div className={cn("relative shrink-0", isStacked ? "w-24 h-24" : "w-12 h-12")}>
        <Image 
          src="/logo.png" 
          alt="BachelorBite Logo" 
          fill
          style={{ objectFit: "contain" }}
          sizes="(max-width: 768px) 10vw, 5vw"
        />
      </div>
      <span
        className={cn(
          "font-headline text-2xl font-bold tracking-tight text-foreground",
          isStacked && "text-center"
        )}
      >
        BachelorBite
      </span>
    </LinkComponent>
  );
}
