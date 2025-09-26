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
          d="M7 2V13.2C7 14.3044 7.42143 15.3673 8.17157 16.1174C8.92172 16.8675 9.98479 17.3 11.1 17.3H12.9C14.0152 17.3 15.0783 16.8675 15.8284 16.1174C16.5786 15.3673 17 14.3044 17 13.2V2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-2xl font-bold font-headline">Meal Calculator</span>
    </Link>
  );
}
