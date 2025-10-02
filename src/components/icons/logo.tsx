
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

// Using a custom LinkComponent to handle Next.js Link props
function LinkComponent({ href, children, ...props }: ComponentProps<typeof Link>) {
  return <Link href={href} {...props}>{children}</Link>;
}


export function Logo() {
  return (
    <LinkComponent href="/" className="flex items-center gap-2" aria-label="BachelorBite Home">
      <svg width="48" height="48" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="100" fill="#2E3A33"/>
        <path d="M129.5 65.5C129.5 61.3579 126.142 58 122 58H110.5C108.015 58 106 55.9853 106 53.5C106 51.0147 108.015 49 110.5 49H125C129.142 49 132.5 52.3579 132.5 56.5V65.5" stroke="#A7D1AB" strokeWidth="6" strokeLinecap="round"/>
        <path d="M152 108C152 101.373 146.627 96 140 96H107.5C104.186 96 101.5 93.3137 101.5 90V83C101.5 79.6863 98.8137 77 95.5 77H86.5" stroke="#A7D1AB" strokeWidth="6" strokeLinecap="round"/>
        <path d="M102 121C102 119.343 100.657 118 99 118H90C88.3431 118 87 119.343 87 121V124.5C87 126.157 85.6569 127.5 84 127.5H75C73.3431 127.5 72 126.157 72 124.5V121" stroke="#A7D1AB" strokeWidth="6" strokeLinecap="round"/>
        <path d="M123.5 125V148.5C123.5 150.709 121.709 152.5 119.5 152.5H112" stroke="#A7D1AB" strokeWidth="6" strokeLinecap="round"/>
        <path d="M87 148.5C87 150.709 85.2091 152.5 83 152.5H75.5" stroke="#A7D1AB" strokeWidth="6" strokeLinecap="round"/>
        <path d="M126 102.5L145 77.5" stroke="#E8D59A" strokeWidth="6" strokeLinecap="round"/>
        <path d="M151.5 77.5H145" stroke="#E8D59A" strokeWidth="6" strokeLinecap="round"/>
        <path d="M148.25 74.25V80.75" stroke="#E8D59A" strokeWidth="6" strokeLinecap="round"/>
        <path d="M141.75 74.25V80.75" stroke="#E8D_59A" strokeWidth="6" strokeLinecap="round"/>
        <path d="M135.25 74.25V80.75" stroke="#E8D59A" strokeWidth="6" strokeLinecap="round"/>
        <path d="M128.75 74.25V80.75" stroke="#E8D59A" strokeWidth="6" strokeLinecap="round"/>
      </svg>
      <span className="text-3xl font-bold font-headline text-foreground">BachelorBite</span>
    </LinkComponent>
  );
}
