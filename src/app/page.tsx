
"use client";

import { useRef, useEffect, useState, useLayoutEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Utensils, Wheat, CheckCircle } from "lucide-react";
import { gsap } from "gsap";
import { SplitText } from "@/components/animation/SplitText";
import { useFontLoader } from "@/lib/hooks/use-font-loader";
import { LandingHeader } from "@/components/app/landing-header";

const FloatingElements = () => {
    const containerRef = useRef<HTMLDivElement>(null);
  
    useLayoutEffect(() => {
      const ctx = gsap.context(() => {
        const elements = gsap.utils.toArray(".floating-element");
        elements.forEach((el: any) => {
          gsap.to(el, {
            y: 'random(-20, 20)',
            x: 'random(-10, 10)',
            duration: 'random(5, 8)',
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });
        });
      }, containerRef);
  
      return () => ctx.revert();
    }, []);
  
    const elements = [
        { Icon: Utensils, size: "w-8 h-8", top: "15%", left: "10%" },
        { Icon: Wheat, size: "w-6 h-6", top: "25%", left: "80%" },
        { Icon: CheckCircle, size: "w-6 h-6", top: "70%", left: "20%" },
        { Icon: Utensils, size: "w-10 h-10", top: "85%", left: "90%" },
    ];
  
    return (
      <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden">
        {elements.map((el, i) => (
          <div
            key={i}
            className={`floating-element absolute ${el.size} text-white opacity-80 filter drop-shadow-lg`}
            style={{ top: el.top, left: el.left }}
          >
            <el.Icon strokeWidth={1.5}/>
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
    .fromTo(".cta-buttons",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out"},
        "-=0.5"
    );

  }, [areFontsLoaded]);

  return (
    <div ref={containerRef} className="min-h-screen w-full yellow-gradient-bg text-slate-800 overflow-hidden relative">
      <LandingHeader />
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

      <main className="relative z-10 flex h-screen flex-col items-center justify-center p-4 md:p-8">
        {/* Text Content */}
        <div className="text-center space-y-4 pt-20 md:pt-12 flex-grow flex flex-col justify-center">
            {areFontsLoaded && (
              <>
                 <div className="flex flex-col items-center">
                    <SplitText
                      text="Meet the"
                      as="h2"
                      className="text-xl md:text-2xl font-medium text-slate-600 animate-text-meet hidden md:flex"
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
        <div className="flex flex-col items-center text-center w-full">
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
          
          <div className="h-20 mt-4 flex items-center justify-center w-full">
              <div className="cta-buttons opacity-0 flex flex-col sm:flex-row items-center gap-4">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-lg rounded-full shadow-lg hover:shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-1 transform transition-all duration-300"
                  onClick={() => router.push("/about")}
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
          </div>
        </div>
      </main>
    </div>
  );
}
