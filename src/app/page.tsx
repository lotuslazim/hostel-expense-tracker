
"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 200),  // Mascot appears
      setTimeout(() => setStep(2), 700),  // "Meet the"
      setTimeout(() => setStep(3), 900),  // "Bachelor Bite"
      setTimeout(() => setStep(4), 1400), // Dot
      setTimeout(() => setStep(5), 1600), // Subtitle
      setTimeout(() => setStep(6), 1800), // Button
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="min-h-screen w-full yellow-gradient-bg text-slate-800 overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 z-0 opacity-50">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="absolute top-[10%] left-[5%] w-12 h-12 text-white/50 animate-subtle-float animation-delay-0"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="absolute top-[50%] left-[15%] w-8 h-8 text-white/50 animate-subtle-float animation-delay-[-2s]"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="absolute bottom-[15%] right-[10%] w-20 h-20 text-white/30 animate-subtle-float animation-delay-[-5s]"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="absolute top-[25%] right-[20%] w-10 h-10 text-white/50 animate-subtle-float animation-delay-[-10s]"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="absolute bottom-[10%] left-[25%] w-16 h-16 text-white/40 animate-subtle-float animation-delay-[-8s]"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 12h10" /><path d="M12 7v10" /></svg>
      </div>

      <main className="relative z-10 flex h-screen flex-col items-center justify-between p-4 md:p-8">
        <div /> 

        <div className="flex flex-col items-center text-center">
            {/* Text Content */}
            <div className="mt-8 space-y-2">
              <h2
                className={cn(
                  "text-lg font-medium text-slate-600 transition-all duration-500",
                  "animate-pop-in"
                )}
                style={{ animationDelay: '700ms', opacity: step >= 2 ? 1: 0 }}
              >
                Meet the
              </h2>
              <h1 className="flex items-center justify-center text-5xl md:text-6xl font-bold font-headline tracking-tight">
                <span
                  className={cn(
                    "transition-all duration-500 ease-out",
                    "animate-slide-in-right"
                  )}
                  style={{ animationDelay: '900ms', opacity: step >= 3 ? 1: 0 }}
                >
                  Bachelor
                </span>
                <span
                  className={cn(
                    "ml-2 text-primary transition-all duration-500 ease-out delay-100",
                    "animate-slide-in-right"
                  )}
                  style={{ animationDelay: '1000ms', opacity: step >= 3 ? 1: 0 }}
                >
                  Bite
                </span>
                <span
                  className={cn(
                    "text-primary transition-all duration-300 delay-300",
                    "animate-pop-in"
                  )}
                  style={{ animationDelay: '1400ms', opacity: step >= 4 ? 1: 0 }}
                >
                  .
                </span>
              </h1>
              <p
                className={cn(
                  "text-md text-slate-500 max-w-xs transition-all duration-500 delay-200",
                  "animate-slide-up-fade"
                )}
                style={{ animationDelay: '1600ms', opacity: step >= 5 ? 1: 0 }}
              >
                No notes, no Excel—just one tap, done.
              </p>
            </div>
            
            {/* Mascot */}
            <div
              className={cn(
                "relative mt-12 transition-all duration-700 ease-out",
                step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20",
                "animate-slide-up-fade"
              )}
              style={{ animationDelay: '200ms' }}
            >
              <Image
                src="/mascot.png"
                alt="BachelorBite Mascot"
                width={400}
                height={400}
                className="object-contain drop-shadow-xl h-64 w-64 md:h-[400px] md:w-[400px]"
                priority
              />
              {/* Shadow */}
              <div className={cn("absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-8 bg-black/5 rounded-full blur-lg transition-opacity duration-500", step >=1 ? 'opacity-100' : 'opacity-0')} />
            </div>
        </div>

        {/* CTA Button */}
        <div className={cn("w-full max-w-md pb-4 transition-all duration-500", "animate-slide-up-fade")} style={{ animationDelay: '1800ms', opacity: step >= 6 ? 1: 0 }}>
          <Button
            size="lg"
            className="w-full text-lg rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300"
            onClick={() => router.push("/signup")}
          >
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </main>
    </div>
  )
}
