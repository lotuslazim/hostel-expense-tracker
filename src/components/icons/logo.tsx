
import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2"
      aria-label="Meal Calculator Home"
    >
      <div className="w-10 h-10">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="plateGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F5F7DB" />
              <stop offset="100%" stopColor="#F0F2BD" />
            </linearGradient>
          </defs>
          
          {/* Spoon */}
          <path d="M12 15C12 5 18 2 22 10V40C18 30 12 35 12 40V85C12 95 6 98 2 90C-2 82 4 75 8 70V25C12 20 12 15 12 15Z" fill="#4B352A" />

          {/* Fork */}
          <path d="M88 15C88 5 82 2 78 10V22H82V12C82 8 85 9 86 15H88Z" fill="#4B352A" />
          <path d="M78 22V40C82 30 88 35 88 40V85C88 95 94 98 98 90C102 82 96 75 92 70V25C88 20 88 15 88 15M78 22V10C74 2 68 5 68 15H70C71 9 74 8 78 12V22Z" fill="#4B352A" />
          
          {/* Plate */}
          <circle cx="50" cy="50" r="35" fill="url(#plateGradient)" />
          <circle cx="50" cy="50" r="35" stroke="#4B352A" strokeWidth="2" />
          <circle cx="50" cy="50" r="30" stroke="#4B352A" strokeOpacity="0.3" strokeWidth="1" />

          {/* Calculator Buttons */}
          <rect x="38" y="40" width="8" height="8" rx="2" fill="#CA7842" />
          <path d="M42 35V45M37 40H47" stroke="#F0F2BD" strokeWidth="1.5" strokeLinecap="round" />
          
          <rect x="54" y="40" width="8" height="8" rx="2" fill="#CA7842" />
          <path d="M57 43H63" stroke="#F0F2BD" strokeWidth="1.5" strokeLinecap="round" />
          
          <rect x="38" y="55" width="24" height="8" rx="2" fill="#CA7842" />
          <path d="M42 58H58M42 60H58" stroke="#F0F2BD" strokeWidth="1.5" strokeLinecap="round" />

          {/* Leaf accent */}
          <path d="M68 32C68 32 70 28 74 28C78 28 80 32 80 32C80 32 78 36 74 36C70 36 68 32 68 32Z" fill="#B2CD9C" />
           <path d="M74 36C74 36 76 39 74 42" stroke="#4B352A" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-2xl font-bold font-headline" style={{color: '#4B352A'}}>Meal Calculator</span>
    </Link>
  );
}
