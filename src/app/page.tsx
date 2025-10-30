"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Exact Let'sTalk Design */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Curved lines matching Let'sTalk */}
          <svg className="absolute w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
            <path d="M 0 200 Q 300 100 600 150 T 1200 200" stroke="#e0f2fe" strokeWidth="2" fill="none" opacity="0.5" />
            <path d="M 0 400 Q 300 300 600 350 T 1200 400" stroke="#d1fae5" strokeWidth="2" fill="none" opacity="0.5" />
          </svg>

          {/* Floating dots - scattered around */}
           <div className="absolute top-1/4 left-[10%] w-3 h-3 bg-teal-500 rounded-full opacity-60"></div>
          <div className="absolute top-1/2 right-[12%] w-4 h-4 bg-pink-500 rounded-full opacity-60"></div>
          <div className="absolute bottom-1/4 left-[20%] w-3 h-3 bg-amber-400 rounded-full opacity-60"></div>
          <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-white rounded-full opacity-80 shadow-lg"></div>
          <div className="absolute bottom-[30%] right-[8%] w-3 h-3 bg-teal-500 rounded-full opacity-60"></div>
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="flex flex-col items-center justify-center -mt-16">
            {/* Text Content - Top Center */}
            <div className="space-y-4 text-center mb-8 md:mb-12">
              <p className="text-teal-500 font-semibold text-lg transform -translate-y-2">Meet the</p>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                <span className="text-slate-900">{"Bachelor"}</span>
                <span className="text-amber-400 ml-2">{"Bite"}</span>
              </h1>
            </div>

            {/* Central Character Area with Mascot - Centered */}
            <div className="relative w-full max-w-2xl h-96 flex items-center justify-center">
              {/* Large golden circle background */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-72 h-72 bg-gradient-to-br from-amber-300 to-amber-400 rounded-full opacity-90"></div>
              </div>

              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-12 text-center z-30">
                <p className="text-slate-700 font-semibold text-lg md:text-xl">
                  No notes, no Excel—just one tap, done.
                </p>
              </div>

              <div className="absolute inset-0 flex items-end justify-center z-10 pb-[-3]">
                <Image
                  src="/mascot.png"
                  alt="BachelorBite Mascot"
                  width={280}
                  height={280}
                  className="object-contain drop-shadow-2xl w-96 h-96"
                />
              </div>

              {/* Main content card - left side */}

              {/* Chat bubble - top left */}

              {/* Emoji reaction - top right */}

              {/* Curved line decoration - right side */}
              <div className="absolute right-0 top-1/2 text-slate-400 text-5xl z-40">⌢</div>

              {/* Message card - bottom right */}
              <div className="absolute right-0 bottom-1/4 bg-slate-700 text-white rounded-2xl p-3 z-30 shadow-lg w-40 h-14 py-2.5 mx-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold">
                    💰
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold">Expense Update</p>
                    <p className="text-xs text-slate-300">₹450 settled</p>
                  </div>
                </div>
              </div>

              {/* Small profile pic - left middle */}

              <svg
                className="absolute -bottom-8 left-0 right-0 w-full h-32 z-0"
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
              >
                <path d="M 0 40 Q 300 0 600 20 T 1200 40 L 1200 120 L 0 120 Z" fill="#0f172a" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <div className="py-12 -mt-24 text-center z-20 relative bg-[#0f172a]">
        
      </div>

      {/* How It Works */}
      

      {/* CTA Section */}
      

      {/* Footer */}
      
    </div>
  )
}
