
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
        <path d="M75.1852 145.556H62.5926" stroke="#A7D1AB" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M123.333 100.111C123.333 93.3093 117.913 87.8889 111.111 87.8889H88.8889" stroke="#A7D1AB" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M100 55.5556C124.533 55.5556 144.444 75.4671 144.444 100C144.444 124.533 124.533 144.444 100 144.444C75.4671 144.444 55.5556 124.533 55.5556 100C55.5556 75.4671 75.4671 55.5556 100 55.5556Z" stroke="#2E3A33" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M88.8889 112.333C88.8889 119.135 94.3093 124.556 101.111 124.556L116.667 124.556" stroke="#2E3A33" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M111.111 88.8889C111.111 85.064 108.047 82 104.222 82C100.397 82 97.3333 85.064 97.3333 88.8889C97.3333 92.7138 100.397 95.7778 104.222 95.7778" fill="#2E3A33"/>
      </svg>
      <span className="text-3xl font-bold font-headline text-foreground">BachelorBite</span>
    </LinkComponent>
  );
}
