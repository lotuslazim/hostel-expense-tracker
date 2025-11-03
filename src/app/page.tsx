
"use client"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/icons/logo"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { cn } from "@/lib/utils"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    let touchStartY = 0
    let touchEndY = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.changedTouches[0].screenY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndY = e.changedTouches[0].screenY
      handleSwipe()
    }

    const handleSwipe = () => {
      if (touchStartY - touchEndY > 50) { // Swipe up
        router.push("/login")
      }
    }

    window.addEventListener("touchstart", handleTouchStart)
    window.addEventListener("touchend", handleTouchEnd)

    return () => {
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [router])


  return (
    <div className="relative h-screen w-full yellow-gradient-bg bg-retro-pattern overflow-hidden">
      {/* Animated Borders */}
      <div className="animated-border left-0">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="animated-border-element" style={{ animationDelay: `${i * 1}s` }}></div>
        ))}
      </div>
       <div className="animated-border right-0">
         {[...Array(10)].map((_, i) => (
          <div key={i} className="animated-border-element" style={{ animationDelay: `${i * 1}s`, animationDirection: 'reverse' }}></div>
        ))}
      </div>
      
      <main className="relative z-10 flex h-full flex-col items-center justify-between p-4 md:p-8 pt-24 pb-8">
        {/* Text Content */}
        <div className="text-center space-y-2 z-10">
          <div className="animate-text-pop-in [animation-delay:500ms] opacity-0">
            <h2 className="text-2xl font-medium tracking-wide text-slate-800/80">
              Meet the
            </h2>
          </div>
          <h1 className="text-6xl font-bold tracking-tight font-headline animate-text-slide-in [animation-delay:800ms] opacity-0">
            <span className="text-slate-800">
              Bachelor
            </span>
            <span className="text-primary">
              Bite
            </span>
            <span className="text-primary inline-block animate-pop-in [animation-delay:1400ms] opacity-0">
              .
            </span>
          </h1>
          <p className="text-md text-slate-800/70 max-w-xs mx-auto animate-slide-up-fade [animation-delay:1600ms] opacity-0">
            No notes, no Excel—just one tap, done.
          </p>
        </div>

        {/* Mascot */}
        <div className="relative z-0 w-full flex-grow flex items-end justify-center">
            <div className="relative animate-slide-up [animation-delay:2000ms] opacity-0">
                <Logo isMascotAnimated={true} mascotSize="large" className="opacity-80" />
                <div className="mascot-shadow animate-shadow-fade-in [animation-delay:2500ms] opacity-0"></div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="z-10 h-16">
            {/* Desktop Button */}
            <div className="hidden md:block animate-fade-in-scale [animation-delay:2800ms] opacity-0">
                <Button asChild size="lg" className="rounded-full shadow-lg hover:-translate-y-1 transform transition-all duration-300">
                    <Link href="/login">Get Started</Link>
                </Button>
            </div>
            {/* Mobile Swipe Indicator */}
            <div className="md:hidden flex flex-col items-center justify-center animate-fade-in-scale [animation-delay:2800ms] opacity-0">
                 <div className="w-24 h-12 bg-white/30 rounded-full blur-xl animate-glow-pulse"></div>
                 <p className="text-sm text-slate-800/60 -mt-4">Swipe up</p>
            </div>
        </div>
      </main>
    </div>
  )
}

    