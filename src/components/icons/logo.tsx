import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2"
      aria-label="Meal Calculator Home"
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-primary"
      >
        <path
          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="7" y="6" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 11H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 15H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 9V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span className="text-2xl font-bold font-headline">Meal Calculator</span>
    </Link>
  );
}
