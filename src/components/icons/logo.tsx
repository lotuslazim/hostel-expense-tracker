
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
      <div className="w-12 h-12"></div>
      <span className="text-3xl font-bold font-headline">
        <span className="text-foreground">Bachelor</span>
        <span className="text-primary">Bite</span>
      </span>
    </LinkComponent>
  );
}
