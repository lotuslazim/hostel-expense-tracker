"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { SplitText } from "@/components/animation/SplitText";
import { useFontLoader } from "@/lib/hooks/use-font-loader";

export default function Home() {
  const router = useRouter();
  const areFontsLoaded = useFontLoader();
  const [isAnimating, setIsAnimating] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!areFontsLoaded || !containerRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => setIsAnimating(false),
    });

    tl.to(".animate-text-meet .char", {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out",
      stagger: 0.1,
    })
    .to([".animate-bachelor", ".animate-bite"], {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1,
    }, "-=0.4")
    .to(".animate-dot", {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: "back.out(1.7)"
    })
    .to(".animate-text-subtitle .char", {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.05,
    }, "-=0.5")
    .fromTo(".mascot-container", 
        { y: "100%", opacity: 0 },
        { y: "0%", opacity: 1, duration: 1, ease: "power3.out" },
        "-=0.5"
    )
    .fromTo(".mascot-shadow",
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1.2, duration: 1, ease: "power3.out" },
        "-=0.8"
    )
    .fromTo(".cta-button, .swipe-indicator",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out"},
        "-=0.5"
    );

  }, [areFontsLoaded]);

  return (
    <div ref={containerRef} className="min-h-screen w-full yellow-gradient-bg text-slate-800 overflow-hidden relative">
      {/* Animated Borders */}
      <div className="animated-border left-0">
        {[...Array(5)].map((_, i) => <div key={i} className="animated-border-element" style={{ animationDelay: `${i * 2}s` }}/>)}
      </div>
      <div className="animated-border right-0">
        {[...Array(5)].map((_, i) => <div key={i} className="animated-border-element" style={{ animationDelay: `${i * 2}s` }}/>)}
      </div>

      {/* Subtle background pattern */}
      <div className="absolute inset-0 z-0 bg-retro-pattern"></div>

      <main className="relative z-10 flex h-screen flex-col items-center justify-between p-4 md:p-8">
        {/* Text Content */}
        <div className="text-center space-y-4 pt-16 md:pt-24 flex-grow flex flex-col justify-center">
            {areFontsLoaded && (
              <>
                 <div className="flex flex-col items-center">
                    <SplitText
                      text="Meet the"
                      as="h2"
                      className="text-xl md:text-2xl font-medium text-slate-600 animate-text-meet"
                      initial={{ opacity: 0, y: 40 }}
                    />
                </div>
                <div className="relative">
                  <h1 className="flex items-center justify-center text-5xl md:text-7xl font-bold font-headline tracking-tight">
                    <span className="animate-bachelor block" style={{ transform: 'translateX(20px)', opacity: 0}}>Bachelor</span>
                    <span className="animate-bite block text-primary ml-3" style={{ transform: 'translateX(20px)', opacity: 0}}>Bite</span>
                    <span className="animate-dot block text-primary" style={{ opacity: 0, scale: 0 }}>.</span>
                  </h1>
                </div>
                 <SplitText
                  text="No notes, no Excel—just one tap, done."
                  as="p"
                  className="text-lg md:text-xl text-slate-500 max-w-md mx-auto animate-text-subtitle"
                  initial={{ opacity: 0, y: 40 }}
                />
              </>
            )}
        </div>

        {/* Mascot & CTA */}
        <div className="flex flex-col items-center text-center w-full flex-shrink-0">
          <div className="relative mascot-container opacity-0">
            <Image
              src="/mascot.png"
              alt="BachelorBite Mascot"
              width={400}
              height={400}
              className="object-contain drop-shadow-xl h-48 w-48 md:h-64 md:w-64"
              priority
            />
            <div className="mascot-shadow opacity-0" />
          </div>
          
          <div className="h-20 mt-4">
              {/* Desktop CTA */}
              <div className="hidden md:block cta-button opacity-0">
                <Button
                  size="lg"
                  className="text-lg rounded-full shadow-lg hover:shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-1 transform transition-all duration-300"
                  onClick={() => router.push("/signup")}
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

               {/* Mobile CTA */}
              <div className="md:hidden swipe-indicator opacity-0 flex flex-col items-center gap-2" onTouchStart={() => router.push('/login')}>
                  <div className="w-12 h-12 rounded-full bg-white/50 animate-glow-pulse flex items-center justify-center">
                    <ArrowRight className="h-6 w-6 -rotate-90 text-slate-800" />
                  </div>
                   <span className="text-sm font-medium text-slate-600">Swipe Up</span>
              </div>
          </div>
        </div>
      </main>
    </div>
  );
}
