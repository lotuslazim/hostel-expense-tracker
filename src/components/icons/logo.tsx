
import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2"
      aria-label="BachelorBite Home"
    >
      <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Dino Body */}
        <path d="M12.2,27.3c-1.2-0.3-2.3-1.1-2.9-2.2c-0.6-1.1-0.7-2.4-0.4-3.6l2-8.5c0.3-1.2,1.1-2.3,2.2-2.9s2.4-0.7,3.6-0.4l2.5,0.6c0.5,0.1,0.9,0.4,1.2,0.8c0.3,0.4,0.4,0.9,0.4,1.4v13.5c0,1.8-1.5,3.3-3.3,3.3h-1.5C14.8,29.3,13.4,28.5,12.2,27.3z" fill="hsl(var(--primary))"/>
        {/* Dino Head */}
        <path d="M22.1,10.6c-0.8-1-2.1-1.6-3.4-1.4l-2.5-0.6c-1.2-0.3-2.4,0.1-3.3,0.9c-0.9,0.8-1.3,2-1.1,3.2l0.6,2.5c0.1,0.5,0.4,0.9,0.8,1.2c0.4,0.3,0.9,0.4,1.4,0.4h5c1.8,0,3.3-1.5,3.3-3.3C23.1,12.4,22.7,11.5,22.1,10.6z" fill="hsl(var(--primary))"/>
        {/* Sunglasses */}
        <path d="M17.1,14.3h-5c-0.2,0-0.4-0.2-0.4-0.4s0.2-0.4,0.4-0.4h5c0.2,0,0.4,0.2,0.4,0.4S17.3,14.3,17.1,14.3z" fill="hsl(var(--primary-foreground))" />
        <path d="M22.1,14.3h-3c-0.2,0-0.4-0.2-0.4-0.4s0.2-0.4,0.4-0.4h3c0.2,0,0.4,0.2,0.4,0.4S22.3,14.3,22.1,14.3z" fill="hsl(var(--primary-foreground))" />
        <path d="M18.6,13.9c-0.5,0-1-0.2-1.3-0.6l-1-1c-0.3-0.3-0.3-0.8,0-1.1s0.8-0.3,1.1,0l1,1c0.3,0.3,0.3,0.8,0,1.1C19,13.8,18.8,13.9,18.6,13.9z" fill="hsl(var(--primary-foreground))" />
        {/* Dino Smile */}
        <path d="M14.6,23.3c-1.5,0-2.8-0.8-3.5-2.1c-0.2-0.4,0-0.9,0.4-1.1s0.9,0,1.1,0.4c0.5,0.9,1.4,1.5,2.4,1.5s1.9-0.5,2.4-1.5c0.2-0.4,0.7-0.6,1.1-0.4s0.6,0.7,0.4,1.1C17.4,22.5,16.1,23.3,14.6,23.3z" fill="hsl(var(--primary-foreground))" />
      </svg>
      <span className="text-2xl font-bold font-headline text-foreground">Bachelor<span className="text-primary">Bite</span></span>
    </Link>
  );
}
