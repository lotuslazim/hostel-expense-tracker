
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
        "flex items-center gap-3",
        isStacked && "flex-col"
      )}
      aria-label="BachelorBite Home"
    >
      <div className={cn("shrink-0", isStacked ? "w-20 h-20" : "w-10 h-10")}>
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M41.8562 25.1092C41.8562 25.1092 42.4143 21.0831 38.6534 20.25C34.8926 19.4169 31.0421 22.1332 31.0421 22.1332C31.0421 22.1332 29.8028 19.2393 25.9353 20.189C22.0678 21.1387 21.8562 25.122 21.8562 25.122" stroke="black" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20.6973 24.629C20.6973 24.629 20.1983 28.1751 23.4984 29.416C26.7985 30.6569 29.8562 28.3335 29.8562 28.3335C29.8562 28.3335 30.9545 30.8252 34.3802 29.5003C37.8059 28.1754 38.8562 24.629 38.8562 24.629" stroke="black" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M21.8562 25.1092C21.8562 23.4293 23.2201 22.0654 24.9001 22.0654H26.9001C28.0046 22.0654 28.9001 22.9608 28.9001 24.0654V27.0654C28.9001 28.17 28.0046 29.0654 26.9001 29.0654H24.9001C23.2201 29.0654 21.8562 27.7015 21.8562 26.0215V25.1092Z" fill="black"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M32.8562 28.0654C32.8562 29.17 33.7517 30.0654 34.8562 30.0654H36.8562C38.5362 30.0654 39.9 28.7015 39.9 27.0215V26.1092C39.9 24.4293 38.5362 23.0654 36.8562 23.0654H34.8562C33.7517 23.0654 32.8562 23.9608 32.8562 25.0654V28.0654Z" fill="black"/>
          <path d="M47.7801 39.0213C47.0185 35.539 44.2045 32.9154 40.8562 32.0654M15.8562 32.0654C19.2045 32.9154 22.0185 35.539 22.8562 39.0213" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
          <path d="M22.8562 39.0213C22.4339 40.7932 22.1438 42.6631 22.0221 44.5654H48.6904C48.5687 42.6631 48.2786 40.7932 47.7801 39.0213C45.3426 38.6017 43.1492 37.3824 41.3418 35.575C37.7271 31.9602 33.1904 31.9602 29.5757 35.575C27.7683 37.3824 25.5749 38.6017 22.8562 39.0213Z" fill="#F0E68C"/>
          <path d="M22.022 44.5654C22.1438 42.6631 22.4339 40.7932 22.8562 39.0213M48.6903 44.5654C48.5686 42.6631 48.2785 40.7932 47.7801 39.0213M22.8562 39.0213C25.5749 38.6017 27.7683 37.3824 29.5757 35.575C33.1904 31.9602 37.727 31.9602 41.3418 35.575C43.1492 37.3824 45.3426 38.6017 47.7801 39.0213M22.8562 39.0213C21.9213 38.8354 21.0408 38.5298 20.222 38.1147M47.7801 39.0213C48.715 38.8354 49.5955 38.5298 50.4144 38.1147" stroke="#388E3C" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M22.0221 44.5654H48.6904V48.5654H22.0221V44.5654Z" fill="#F0E68C" stroke="#388E3C" strokeWidth="1.5"/>
          <path d="M22.0221 48.5654H48.6904V52.5654H22.0221V48.5654Z" fill="#F0E68C" stroke="#388E3C" strokeWidth="1.5"/>
          <path d="M22.0221 52.5654H48.6904V56.5654H22.0221V52.5654Z" fill="#F0E68C" stroke="#388E3C" strokeWidth="1.5"/>
          <path d="M20.222 38.1147C16.5367 36.2163 14 32.535 14 28.3335V27.3335C14 21.0142 19.1577 15.8564 25.477 15.8564H45.2355C51.5548 15.8564 56.7125 21.0142 56.7125 27.3335V28.3335C56.7125 32.535 54.1758 36.2163 50.4144 38.1147" fill="#4CAF50"/>
          <path d="M14 27.3335V28.3335C14 32.535 16.5367 36.2163 20.222 38.1147M56.7125 27.3335V28.3335C56.7125 32.535 54.1758 36.2163 50.4144 38.1147M14 27.3335C14 21.0142 19.1577 15.8564 25.477 15.8564H45.2355C51.5548 15.8564 56.7125 21.0142 56.7125 27.3335M14 27.3335H10.8562M56.7125 27.3335H59.8562" stroke="#388E3C" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M48.6904 44.5654C48.6904 44.5654 52.8562 48.0654 52.8562 53.0654C52.8562 58.0654 48.3562 59.5654 45.8562 59.5654C43.3562 59.5654 41.8562 56.5654 41.8562 56.5654" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22.0221 44.5654C22.0221 44.5654 17.8562 48.0654 17.8562 53.0654C17.8562 58.0654 22.3562 59.5654 24.8562 59.5654C27.3562 59.5654 28.8562 56.5654 28.8562 56.5654" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
