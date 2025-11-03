
"use client";

import { useRef, useEffect, useState, useLayoutEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Utensils, Wheat, CheckCircle } from "lucide-react";
import { gsap } from "gsap";
import { SplitText } from "@/components/animation/SplitText";
import { useFontLoader } from "@/lib/hooks/use-font-loader";

// Simple SVG icons for floating elements
const ForkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 4V20M16 4V20M12 4V20M8 4C8 2.89543 7.10457 2 6 2C4.89543 2 4 2.89543 4 4V9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SpoonIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4V20M12 4C12 2.34315 10.6569 1 9 1C7.34315 1 6 2.34315 6 4C6 5.65685 7.34315 7 9 7C10.6569 7 12 5.65685 12 4Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const PlateIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
    </svg>
);


const FloatingElements = () => {
    const containerRef = useRef<HTMLDivElement>(null);
  
    useLayoutEffect(() => {
      const ctx = gsap.context(() => {
        const elements = gsap.utils.toArray(".floating-element");
        elements.forEach((el: any) => {
          gsap.to(el, {
            x: `random(-30, 30)`,
            y: `random(-20, 20)`,
            duration: `random(6, 10)`,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
        });
      }, containerRef);
  
      return () => ctx.revert();
    }, []);
  
    const elements = [
        { Icon: PlateIcon, size: "w-8 h-8", top: "15%", left: "10%" },
        { Icon: ForkIcon, size: "w-6 h-6", top: "25%", left: "80%" },
        { Icon: SpoonIcon, size: "w-6 h-6", top: "70%", left: "20%" },
        { Icon: PlateIcon, size: "w-10 h-10", top: "85%", left: "90%" },
        { Icon: ForkIcon, size: "w-5 h-5", top: "50%", left: "5%" },
        { Icon: SpoonIcon, size: "w-8 h-8", top: "5%", left: "50%" },
    ];
  
    return (
      <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden">
        {elements.map((el, i) => (
          <div
            key={i}
            className={`floating-element absolute ${el.size} opacity-20 filter drop-shadow-lg`}
            style={{ top: el.top, left: el.left }}
          >
            <el.Icon />
          </div>
        ))}
      </div>
    );
};

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

      {/* Floating SVG elements */}
      <FloatingElements />

      {/* Subtle background pattern */}
      <div className="absolute inset-0 z-0 bg-retro-pattern"></div>

      <main className="relative z-10 flex h-screen flex-col items-center justify-around p-4 md:p-8">
        {/* Text Content */}
        <div className="text-center space-y-4 pt-8 md:pt-12 flex-grow flex flex-col justify-start">
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
              className="object-contain drop-shadow-xl h-64 w-64 md:h-80 md:w-80"
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
