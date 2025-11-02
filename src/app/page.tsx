"use client"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/icons/logo"
import Link from "next/link"

export default function Home() {

  return (
    <div className="relative h-screen yellow-gradient-bg bg-retro-pattern overflow-hidden">
      <main className="relative z-10 flex h-screen flex-col items-center justify-around p-4 md:p-8">
        {/* Mascot */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-subtle-float" style={{ animationDelay: '0ms', opacity: 1 }}>
          <Logo isMascotAnimated={true} mascotSize="large" className="opacity-80" />
        </div>

        {/* Text Content */}
        <div className="text-center space-y-2 z-10 mt-16">
          <div className="text-center">
            <h2 className="text-2xl font-medium tracking-wide text-slate-800/80 transition-all duration-500 delay-200 animate-slide-in-right" style={{ animationDelay: '600ms', opacity: 1 }}>
              Meet the
            </h2>
          </div>
          <h1 className="text-6xl font-bold tracking-tight animate-pop-in font-headline" style={{ animationDelay: '800ms', opacity: 1 }}>
            <span className="text-slate-800 transition-all duration-500 ease-out animate-slide-in-right" style={{ animationDelay: '900ms', opacity: 1 }}>
              Bachelor
            </span>
            <span className="text-primary transition-all duration-500 ease-out animate-slide-in-right" style={{ animationDelay: '1200ms', opacity: 1 }}>
              Bite
            </span>
            <span className="text-primary transition-all duration-500 ease-out animate-slide-in-right" style={{ animationDelay: '1400ms', opacity: 1 }}>
              .
            </span>
          </h1>
          <div className="text-center">
            <p className="text-md text-slate-800/70 max-w-xs transition-all duration-500 delay-200 animate-slide-up-fade" style={{ animationDelay: '1600ms', opacity: 1 }}>
              No notes, no Excel—just one tap, done.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="z-10 animate-fade-in-scale" style={{ animationDelay: '1800ms', opacity: 1 }}>
          {/* This button has been removed as per user request. */}
        </div>
      </main>
    </div>
  )
}
