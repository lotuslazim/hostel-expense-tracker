
import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2"
      aria-label="NourishTrack Home"
    >
        <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="20" fill="hsl(var(--primary))"/>
            <path d="M16 22C18.2534 18.5999 22.1873 17.065 25.5 18C29.0833 19.0024 32.5 22.5 32 26C31.5 29.5 28.5 32 25 32C21.5 32 18.5 29.5 18.5 26" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M29 18C30.6667 17.3333 34 16 35 14" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      <span className="text-2xl font-bold font-headline text-foreground">NourishTrack</span>
    </Link>
  );
}
