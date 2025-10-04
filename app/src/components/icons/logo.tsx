import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

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
      aria-label="NourishTrack Home"
    >
      <svg width={isStacked ? "80" : "40"} height={isStacked ? "80" : "40"} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <path d="M9 1H10V2H11V3H12V4H13V5H14V6H15V7H16V8H17V7H18V6H19V7H20V8H19V9H17V10H16V11H15V12H14V13H13V14H12V15H11V16H10V17H9V18H8V19H7V20H6V21H5V22H4V23H5V22H6V21H7V20H8V19H9V18H10V17H11V16H12V15H13V14H14V13H15V12H16V11H17V10H18V9H19V8H20V7H21V8H22V10H21V11H20V12H19V13H18V14H17V15H16V16H15V17H14V18H13V19H12V20H11V21H10V22H9V23H8V22H7V21H6V20H5V19H4V17H3V16H2V15H1V14H0V12H1V11H2V10H3V9H4V8H5V7H6V6H7V5H8V4H9V3H8V2H7V1H8V0H9V1Z" fill="#A7D1AB"/>
        <path d="M12 5H13V6H12V5Z" fill="white"/>
        <path d="M13 6H14V7H13V6Z" fill="#1A7431"/>
        <path d="M10 6H11V7H10V6Z" fill="#1A7431"/>
        <path d="M10 7H9V8H10V7Z" fill="#1A7431"/>
        <path d="M11 5H12V6H11V5Z" fill="#1A7431"/>
        <path d="M17 8H18V9H17V8Z" fill="#1A7431"/>
        <path d="M19 8V7H18V8H19Z" fill="white"/>
        <path d="M9 17H10V18H9V17Z" fill="#F0F4F2"/>
        <path d="M10 16H11V17H10V16Z" fill="#F0F4F2"/>
        <path d="M11 15H12V16H11V15Z" fill="#F0F4F2"/>
        <path d="M12 14H13V15H12V14Z" fill="#F0F4F2"/>
        <path d="M13 13H14V14H13V13Z" fill="#F0F4F2"/>
        <path d="M14 12H15V13H14V12Z" fill="#F0F4F2"/>
        <path d="M15 11H16V12H15V11Z" fill="#F0F4F2"/>
        <path d="M16 10H17V11H16V10Z" fill="#F0F4F2"/>
      </svg>
      <div className={cn(
        "flex items-baseline",
        isStacked && "flex-col items-center gap-1"
      )}>
        <span className={cn("font-headline font-bold text-foreground", isStacked ? "text-3xl" : "text-xl")}>Nourish</span>
        <span className={cn("font-headline font-bold text-primary", isStacked ? "text-3xl" : "text-xl")}>Track</span>
      </div>
    </LinkComponent>
  );
}
