
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
            <path d="M91.8293 84.8062C87.973 84.8062 84.2399 83.3323 81.2267 80.6865L81.1883 80.7203C78.0792 83.3913 74.218 84.901 70.2183 84.901C62.8351 84.901 56.6436 79.545 55.459 72.3392L55.459 123.333H145.556V97.037L110.37 97.037C110.37 97.037 126.667 69.6296 108.889 57.0371C100.782 51.1965 92.4079 53.0872 87.037 57.037C88.2255 60.199 88.7407 63.5952 88.7407 67.1111C88.7407 75.0594 85.9926 82.0195 91.8293 84.8062Z" fill="#A7D1AB"/>
            <path d="M101.333 123.333V145.556H88.7407" stroke="#A7D1AB" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M75.1852 145.556H62.5926" stroke="#A7D1AB" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M81.2444 80.687C84.2576 83.3328 87.9907 84.8067 91.847 84.8067C85.9926 82.0195 88.7407 75.0594 88.7407 67.1111C88.7407 63.5952 88.2255 60.199 87.037 57.037C92.4079 53.0872 100.782 51.1965 108.889 57.0371C126.667 69.6296 110.37 97.037 110.37 97.037" stroke="#2E3A33" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M62.5926 123.333V109.63L75.1852 103.333L62.5926 97.037V72.3392C62.5926 69.6732 63.486 67.0969 65.1296 65.0371" stroke="#2E3A33" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M55.459 72.3392C56.6436 79.545 62.8351 84.901 70.2183 84.901C74.218 84.901 78.0792 83.3913 81.1883 80.7203" stroke="#2E3A33" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M102.778 77.7778C104.259 77.7778 105.444 76.5926 105.444 75.1111C105.444 73.6296 104.259 72.4445 102.778 72.4445C101.296 72.4445 100.111 73.6296 100.111 75.1111C100.111 76.5926 101.296 77.7778 102.778 77.7778Z" fill="#2E3A33"/>
        </svg>
      <span className="text-3xl font-bold font-headline text-foreground">BachelorBite</span>
    </LinkComponent>
  );
}
