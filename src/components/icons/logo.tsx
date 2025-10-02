
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

// Using a custom LinkComponent to handle Next.js Link props
function LinkComponent({ href, children, ...props }: ComponentProps<typeof Link>)
{
  return <Link href={href} {...props}>{children}</Link>;
}


export function Logo() {
  return (
    <LinkComponent href="/" className="flex items-center gap-2" aria-label="BachelorBite Home">
      <svg width="48" height="48" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M123.504 66H70C61.1634 66 54 73.1634 54 82V124C54 132.837 61.1634 140 70 140H146C154.837 140 162 132.837 162 124V88.8858C162 84.0152 159.255 79.5936 155.193 77.3005L129.193 64.8005C127.054 63.654 124.614 63.6496 122.47 64.7876L110.428 71.0494" stroke="#A7D1AB" strokeWidth="12" strokeLinecap="round"/>
          <path d="M70 66L64 53" stroke="hsl(var(--foreground))" strokeWidth="12" strokeLinecap="round"/>
          <path d="M102 66L96 53" stroke="hsl(var(--foreground))" strokeWidth="12" strokeLinecap="round"/>
          <circle cx="86" cy="103" r="7" fill="hsl(var(--foreground))"/>
          <path d="M96 112L92 124" stroke="#A7D1AB" strokeWidth="10" strokeLinecap="round"/>
      </svg>
      <span className="text-3xl font-bold font-headline">
        <span className="text-foreground">Bachelor</span>
        <span className="text-primary">Bite</span>
      </span>
    </LinkComponent>
  );
}
