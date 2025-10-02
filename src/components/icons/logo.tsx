
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
          <path d="M62 82C62 73.1634 69.1634 66 78 66H154C162.837 66 170 73.1634 170 82V82C170 90.8366 162.837 98 154 98H93.5C81.634 98 72 107.634 72 119.5V119.5C72 129.165 64.165 137 54.5 137H46" stroke="#2E3A33" stroke-width="12" stroke-linecap="round"/>
          <path d="M96 98L106 114" stroke="#A7D1AB" stroke-width="12" stroke-linecap="round"/>
          <path d="M118 98L128 114" stroke="#A7D1AB" stroke-width="12" stroke-linecap="round"/>
          <path d="M152 66L157.333 52" stroke="#2E3A33" stroke-width="12" stroke-linecap="round"/>
          <circle cx="92" cy="82" r="6" fill="#2E3A33"/>
      </svg>
      <span className="text-3xl font-bold font-headline text-foreground">BachelorBite</span>
    </LinkComponent>
  );
}

