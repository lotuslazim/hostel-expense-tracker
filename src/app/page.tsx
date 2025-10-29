
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, Suspense } from "react";
import { Logo } from "@/components/icons/logo";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { IntroDialog } from "@/components/app/IntroDialog";
import { LandingHeader } from "@/components/app/landing-header";
import Image from "next/image";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isMinimumTimeElapsed, setIsMinimumTimeElapsed] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
        setIsMinimumTimeElapsed(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isUserLoading && isMinimumTimeElapsed && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, isMinimumTimeElapsed, router]);

  const showLoader = isUserLoading || !isMinimumTimeElapsed;

  if (showLoader) {
    return (
      <div className="min-h-screen flex items-center justify-center overflow-hidden relative bg-[#121212]">
        <div className="animated-bg-grid-green absolute inset-0 z-0"></div>
        <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="mb-[30px]">
                <svg
                    className="overflow-visible"
                    xmlns="http://www.w3.org/2000/svg"
                    width="150"
                    height="180"
                    viewBox="0 0 300 360"
                >
                    <g transform="translate(0,360) scale(0.1,-0.1)">
                        <path className="animate-draw stroke-white fill-none stroke-[40] [stroke-dasharray:3000]" d="M1135 3520 c-48 -24 -104 -73 -134 -117 -21 -31 -26 -33 -84 -33 -64 0 -131 -23 -156 -53 -9 -11 -11 -31 -8 -59 4 -24 11 -81 17 -128 6 -47 20 -104 32 -128 11 -24 18 -45 15 -48 -10 -10 -323 -5 -350 5 -40 16 -153 14 -185 -3 -37 -19 -65 -53 -88 -106 -37 -86 -19 -270 32 -330 7 -8 22 -42 35 -74 25 -68 90 -144 157 -183 106 -62 307 -123 457 -138 39 -4 73 -9 77 -11 4 -3 -3 -27 -14 -55 -18 -42 -37 -63 -117 -127 -197 -156 -251 -236 -251 -372 0 -58 6 -87 24 -126 13 -28 28 -54 34 -57 5 -4 7 -28 5 -54 -3 -30 1 -58 9 -75 17 -31 64 -73 95 -82 23 -7 27 -17 38 -96 13 -101 88 -290 147 -372 l20 -29 -22 -51 -22 -51 22 -61 c12 -33 26 -65 31 -70 16 -17 10 -55 -10 -66 -11 -5 -36 -10 -56 -10 -77 0 -185 -81 -185 -140 0 -32 13 -48 66 -80 46 -29 116 -34 353 -23 234 11 226 5 216 169 -7 117 -2 134 33 115 10 -5 47 -14 83 -18 54 -8 73 -16 121 -53 31 -25 57 -50 57 -55 1 -6 -12 -23 -29 -38 -16 -16 -30 -37 -30 -47 0 -10 -5 -22 -10 -25 -17 -11 -11 -53 13 -79 22 -25 25 -25 182 -28 186 -2 240 10 300 70 52 53 53 69 6 161 -23 45 -41 85 -41 90 0 5 10 13 23 16 30 9 141 58 147 65 3 3 26 21 51 40 72 54 189 228 189 282 0 9 4 19 8 22 5 3 14 31 21 63 51 231 134 348 292 407 57 21 64 27 67 54 11 103 -252 135 -421 52 -96 -47 -180 -137 -210 -224 -15 -45 -72 -130 -109 -165 -36 -34 -98 -44 -98 -16 0 8 4 15 9 15 5 0 23 11 39 25 81 68 27 171 -85 165 -55 -4 -61 -2 -73 20 -18 33 40 105 107 134 44 20 119 100 148 161 47 97 50 247 6 334 -25 47 -118 133 -187 173 -30 16 -56 34 -59 39 -9 14 13 47 118 178 165 205 205 284 214 427 5 77 2 103 -17 165 -12 40 -32 94 -45 120 -23 43 -23 48 -9 89 20 59 10 96 -41 145 -27 25 -58 73 -85 128 -57 117 -104 169 -194 212 -68 33 -80 35 -172 35 -81 0 -112 -5 -168 -25 l-69 -25 -63 25 c-79 31 -162 33 -219 5z"/>
                        <path className="animate-draw stroke-white fill-none stroke-[40] [stroke-dasharray:3000]" d="M1176 3458 c-37 -14 -72 -44 -98 -87 l-21 -34 24 -18 c13 -10 33 -21 44 -25 11 -3 39 -15 63 -26 46 -22 57 -21 146 11 74 28 211 37 308 21 61 -10 138 -33 283 -85 20 -6 20 -6 1 9 -34 28 -170 74 -269 90 -135 23 -329 4 -390 -39 -16 -11 -29 -9 -93 21 -41 19 -82 34 -90 34 -23 0 -17 14 24 54 54 55 87 69 139 62 65 -9 141 -45 168 -80 22 -28 24 -29 30 -11 13 42 24 51 86 72 172 58 320 8 399 -137 22 -40 29 -47 24 -25 -15 67 -73 135 -149 174 -90 46 -244 36 -339 -22 -41 -26 -51 -28 -60 -16 -17 21 -74 46 -134 58 -61 13 -58 13 -96 -1z"/>
                        <path className="animate-draw stroke-white fill-none stroke-[40] [stroke-dasharray:3000]" d="M1475 3277 c-25 -13 -54 -48 -55 -64 0 -6 -6 -18 -12 -25 -31 -33 -80 -140 -74 -162 14 -55 106 -29 189 52 83 80 95 144 34 180 -48 28 -62 31 -82 19z"/>
                        <path className="animate-draw stroke-white fill-none stroke-[40] [stroke-dasharray:3000]" d="M1051 3206 c-17 -13 -50 -50 -72 -82 -23 -33 -50 -69 -62 -81 -20 -22 -20 -23 -2 -43 10 -11 27 -20 37 -20 29 0 114 47 158 86 69 62 69 113 1 149 -26 13 -31 12 -60 -9z"/>
                        <path className="animate-draw stroke-white fill-none stroke-[40] [stroke-dasharray:3000]" d="M1860 3119 c30 -11 84 -29 119 -40 l63 -21 -5 -37 c-4 -31 -21 -79 -44 -123 -2 -5 0 -8 6 -8 14 0 44 58 46 90 1 14 5 35 9 47 10 31 -13 47 -117 82 -104 34 -164 42 -77 10z"/>
                        <path className="animate-draw stroke-white fill-none stroke-[40] [stroke-dasharray:3000]" d="M1775 3052 c-38 -90 -105 -154 -184 -176 -138 -39 -225 -4 -313 125 -30 44 -37 49 -71 49 -23 0 -51 -8 -67 -20 -37 -27 -139 -72 -225 -100 -79 -25 -111 -46 -55 -36 67 12 257 90 286 117 12 11 36 22 55 25 32 5 36 2 64 -47 77 -132 209 -181 349 -128 72 27 144 104 176 188 31 84 21 86 -15 3z"/>
                        <path className="animate-draw stroke-white fill-none stroke-[40] [stroke-dasharray:3000]" d="M2060 2930 c0 -9 9 -32 19 -52 33 -60 54 -157 48 -223 -10 -119 -60 -217 -183 -360 -43 -49 -95 -116 -116 -149 -37 -58 -64 -129 -54 -144 3 -5 43 -32 90 -61 158 -99 206 -162 206 -273 0 -111 -56 -200 -181 -287 -81 -56 -113 -101 -113 -161 0 -43 5 -55 34 -85 27 -28 41 -35 69 -34 34 2 35 2 6 6 -60 9 -108 85 -90 143 10 32 62 88 125 132 87 64 124 110 154 199 52 147 -16 267 -215 381 -67 39 -71 47 -56 99 16 51 65 123 155 228 179 207 224 375 151 560 -26 66 -49 103 -49 81z"/>
                        <path className="animate-draw stroke-white fill-none stroke-[40] [stroke-dasharray:3000]" d="M601 2814 c-27 -35 -27 -65 2 -92 28 -26 31 -27 84 -4 56 22 60 58 10 96 -43 33 -70 33 -96 0z"/>
                        <path className="animate-draw stroke-white fill-none stroke-[40] [stroke-dasharray:3000]" d="M1580 1781 c0 -20 31 -73 68 -118 50 -62 60 -53 12 12 -22 30 -40 63 -40 74 0 18 2 19 30 5 28 -15 140 -133 140 -149 0 -5 -21 -31 -47 -59 -116 -125 -153 -189 -153 -262 0 -45 3 -51 52 -97 58 -55 170 -137 186 -137 5 0 15 -7 22 -15 22 -26 77 -19 113 16 l32 31 -52 -29 -51 -28 -35 20 c-41 23 -183 134 -221 172 -33 33 -35 87 -5 146 28 55 155 205 185 219 23 11 22 12 -48 91 -40 43 -82 86 -94 94 -30 19 -94 29 -94 14z"/>
                        <path className="animate-draw stroke-white fill-none stroke-[40] [stroke-dasharray:3000]" d="M1668 1563 c-94 -100 -164 -247 -149 -314 11 -50 24 -70 78 -120 61 -57 233 -179 299 -212 149 -75 232 -33 353 182 94 168 170 226 308 237 72 6 118 13 112 18 -2 2 -47 0 -99 -3 -180 -13 -263 -79 -363 -287 -14 -28 -44 -72 -68 -97 -107 -111 -202 -83 -493 144 -96 75 -124 135 -103 218 21 11 40 44 106 61 120 9 8 16 19 16 25 0 7 20 36 45 65 41 48 50 61 42 61 -2 0 -19 -17 -39 -37z"/>
                    </g>
                </svg>
            </div>
            <div className="font-mono font-bold text-2xl text-white overflow-hidden whitespace-nowrap border-r-4 border-r-white w-[14ch] animate-typing">
                Bachelor Bite!
            </div>
        </div>
      </div>
    );
  }

  // If user exists and loading is complete, they'll be redirected by the useEffect
  // Only render landing page if no user exists and minimum time has passed
  if (!isUserLoading && isMinimumTimeElapsed && !user) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        {showIntro && <IntroDialog onOpenChange={() => setShowIntro(false)} />}
        <LandingHeader />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl aspect-[4/3] bg-card rounded-2xl border shadow-lg overflow-hidden flex items-center justify-center">
            {/* Decorative elements */}
            <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 bg-green-200/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 bg-yellow-200/20 rounded-full blur-2xl"></div>
            
            <svg width="100%" height="100%" className="absolute inset-0 z-[1]">
                <path d="M100,50 C200,150 300,50 400,150" stroke="hsl(var(--border))" fill="none" strokeWidth="1"/>
                <path d="M-50,200 C50,100 150,300 250,200" stroke="hsl(var(--border))" fill="none" strokeWidth="1"/>
                <path d="M800,50 C700,150 600,50 500,150" stroke="hsl(var(--border))" fill="none" strokeWidth="1"/>
                 <path d="M1000,400 C900,300 800,500 700,400" stroke="hsl(var(--border))" fill="none" strokeWidth="1"/>
            </svg>

            {/* Tagline */}
            <h2 className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl md:text-3xl font-body font-medium text-center z-30 max-w-sm text-foreground leading-relaxed">
              <span className="text-primary-foreground">No notes, no Excel - just</span>
            </h2>

            {/* Central Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-secondary rounded-full flex items-center justify-center">
               <div className="text-2xl md:text-3xl font-body font-medium text-center z-30 max-w-sm text-primary">
                one tap, Done
              </div>
            </div>

            {/* Bottom Shape */}
            <div className="absolute bottom-0 left-0 w-full h-1/3 z-10">
                 <svg viewBox="0 0 1440 320" className="w-full h-full">
                    <path fill="hsl(var(--foreground))" fillOpacity="1" d="M0,224L80,208C160,192,320,160,480,170.7C640,181,800,235,960,245.3C1120,256,1280,224,1360,208L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
                </svg>
            </div>

            {/* Mascot Image */}
            <div className="absolute bottom-0 left-1/2 w-[350px] z-20 -translate-x-[48%]">
                <Image
                    src="/mascot.png"
                    alt="BachelorBite Mascot"
                    width={800}
                    height={993}
                    className="object-contain"
                    priority
                />
            </div>

             {/* UI Elements that should be above mascot */}
            
             {/* Decorative dots */}
             <div className="absolute w-4 h-4 bg-green-400 rounded-full top-1/3 right-1/4 animate-float z-30"></div>
             <div className="absolute w-3 h-3 bg-red-400 rounded-full top-1/2 left-1/4 animate-float [animation-delay:-2s]"></div>
             <div className="absolute w-2 h-2 bg-blue-400 rounded-full bottom-1/2 right-1/3 animate-float [animation-delay:-4s] z-30"></div>
             <div className="absolute w-3 h-3 bg-purple-400 rounded-full top-1/4 right-1/2 animate-float [animation-delay:-1s] z-30"></div>
             <div className="absolute w-2 h-2 bg-indigo-400 rounded-full bottom-1/3 left-1/3 animate-float [animation-delay:-3s]"></div>
             <div className="absolute w-4 h-4 bg-pink-400 rounded-full top-2/3 left-1/4 animate-float [animation-delay:-5s]"></div>
             <div className="absolute w-3 h-3 bg-teal-400 rounded-full bottom-1/4 right-1/3 animate-float [animation-delay:-0.5s] z-30"></div>
             <div className="absolute w-4 h-4 bg-rose-400 rounded-full top-1/3 left-1/3 animate-float [animation-delay:-1.5s]"></div>
            <div className="absolute w-2 h-2 bg-cyan-400 rounded-full bottom-1/3 right-1/4 animate-float [animation-delay:-2.5s]"></div>
             <div className="absolute w-3 h-3 bg-orange-400 rounded-full top-1/2 right-1/4 animate-float [animation-delay:-3.5s]"></div>
            <div className="absolute w-4 h-4 bg-lime-400 rounded-full bottom-1/3 left-1/4 animate-float [animation-delay:-4.5s]"></div>
             <div className="absolute w-4 h-4 bg-yellow-400 rounded-full bottom-2/3 right-1/4 animate-float [animation-delay:-5.5s]"></div>
            <div className="absolute w-2 h-2 bg-fuchsia-400 rounded-full top-1/3 left-1/2 animate-float [animation-delay:-6.5s]"></div>

          </div>
        </main>
      </div>
    );
  }

  // Render null while waiting for redirect or for the landing page to be ready
  return null;
}

    