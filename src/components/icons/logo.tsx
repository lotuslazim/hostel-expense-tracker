
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
        <path d="M62.5926 71.8519C62.5926 71.8519 91.1111 44.4445 108.889 57.0371C126.667 69.6296 110.37 97.037 110.37 97.037L145.556 97.037L138.889 123.333H62.5926V109.63L75.1852 103.333L62.5926 97.037V71.8519Z" fill="#A7D1AB"/>
        <path d="M101.333 123.333V145.556H88.7407" stroke="#A7D1AB" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M75.1852 145.556H62.5926" stroke="#A7D1AB" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M102.778 77.7778C104.259 77.7778 105.444 76.5926 105.444 75.1111C105.444 73.6296 104.259 72.4445 102.778 72.4445C101.296 72.4445 100.111 73.6296 100.111 75.1111C100.111 76.5926 101.296 77.7778 102.778 77.7778Z" fill="#2E3A33"/>
      </svg>
      <span className="text-3xl font-bold font-headline text-foreground">BachelorBite</span>
    </LinkComponent>
  );
}
