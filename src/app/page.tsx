"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight, Utensils, LineChart, Hand } from "lucide-react";

// Minimalist icons
const PlateIcon = () => (
  <Utensils className="h-full w-full" />
);

const ChartIcon = () => (
  <LineChart className="h-full w-full" />
);

const TapIcon = () => (
    <Hand className="h-full w-full" />
)


export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 200),  // Mascot appears
      setTimeout(() => setStep(2), 700),  // "Meet the"
      setTimeout(() => setStep(3), 900),  // "Bachelor Bite"
      setTimeout(() => setStep(4), 1400), // Dot
      setTimeout(() => setStep(5), 1600), // Subtitle
      setTimeout(() => setStep(6), 1800), // Button
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const getAnimationClass = (s: number) => (step >= s ? "animate-in" : "opacity-0");

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-200 text-slate-800 overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 z-0 opacity-50">
        <PlateIcon  />
        <ChartIcon />
        <TapIcon />
      </div>

      <main className="relative z-10 flex h-screen flex-col items-center justify-between p-4 md:p-8">
        <div /> 

        <div className="flex flex-col items-center text-center">
          {/* Mascot */}
          <div
            className={cn(
              "relative transition-all duration-700 ease-out",
              step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
            )}
          >
            <Image
              src="/mascot.png"
              alt="BachelorBite Mascot"
              width={200}
              height={200}
              className="object-contain drop-shadow-xl h-48 w-48 md:h-56 md:w-56"
              priority
            />
            {/* Shadow */}
            <div className={cn("absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-8 bg-black/5 rounded-full blur-lg transition-opacity duration-500", step >=1 ? 'opacity-100' : 'opacity-0')} />
          </div>

          {/* Text Content */}
          <div className="mt-8 space-y-2">
            <h2
              className={cn(
                "text-lg font-medium text-slate-600 transition-all duration-500",
                getAnimationClass(2),
                "fade-in-0 slide-in-from-bottom-5"
              )}
            >
              Meet the
            </h2>
            <h1 className="flex items-center text-5xl md:text-6xl font-bold font-headline tracking-tight">
              <span
                className={cn(
                  "transition-all duration-500 ease-out",
                  step >= 3 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
                )}
              >
                Bachelor
              </span>
              <span
                className={cn(
                  "ml-2 text-primary transition-all duration-500 ease-out delay-100",
                  step >= 3 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
                )}
              >
                Bite
              </span>
              <span
                className={cn(
                  "text-primary transition-all duration-300 delay-300",
                  getAnimationClass(4),
                  "fade-in-0"
                )}
              >
                .
              </span>
            </h1>
            <p
              className={cn(
                "text-md text-slate-500 max-w-xs transition-all duration-500 delay-200",
                getAnimationClass(5),
                "fade-in-0 slide-in-from-bottom-2"
              )}
            >
              No notes, no Excel—just one tap, done.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className={cn("w-full max-w-md pb-4 transition-all duration-500", getAnimationClass(6), "fade-in-0 slide-in-from-bottom-5")}>
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
  );
}
