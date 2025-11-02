"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ArrowRight, BarChart, Users, FileText, Hand } from "lucide-react"

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
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="min-h-screen w-full yellow-gradient-bg text-slate-800 overflow-hidden relative">
      {/* Subtle background elements */}
      <div className="absolute inset-0 z-0 bg-retro-pattern" />

      <main className="relative z-10 flex h-screen flex-col items-center justify-around p-4 md:p-8">
        {/* Text Content */}
        <div className="flex flex-col items-center space-y-2 z-10 mt-16">
          <div className="text-center">
              <h2
                className={cn(
                  "text-xl font-medium text-slate-800/80 transition-all duration-500 font-headline",
                  "animate-pop-in"
                )}
                style={{ animationDelay: '700ms', opacity: step >= 2 ? 1: 0 }}
              >
                Meet the
              </h2>
          </div>
          <h1 className="flex items-center justify-center text-6xl md:text-7xl font-bold font-headline tracking-tight">
            <span
              className={cn(
                "text-slate-800 transition-all duration-500 ease-out",
                "animate-slide-in-right"
              )}
              style={{ animationDelay: '900ms', opacity: step >= 3 ? 1: 0 }}
            >
              Bachelor
            </span>
            <span
              className={cn(
                "ml-3 text-primary transition-all duration-500 ease-out delay-100",
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
           <div className="text-center">
              <p
                className={cn(
                  "text-md text-slate-800/70 max-w-xs transition-all duration-500 delay-200",
                  "animate-slide-up-fade"
                )}
                style={{ animationDelay: '1600ms', opacity: step >= 5 ? 1: 0 }}
              >
                No notes, no Excel—just one tap, done.
              </p>
          </div>
        </div>

        {/* Mascot */}
        <div className="flex flex-col items-center text-center">
            <div
              className={cn(
                "relative transition-all duration-700 ease-out",
                step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20",
              )}
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
              <div className={cn("absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-8 bg-black/10 rounded-full blur-lg transition-opacity duration-500", step >= 1 ? 'opacity-100' : 'opacity-0')} />
            </div>
        </div>

        <div className="h-20" />
      </main>
    </div>
  )
}
