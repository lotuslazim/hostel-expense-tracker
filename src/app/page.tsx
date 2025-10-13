
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/icons/logo";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";

const FloatingIcon = ({ children, className, animationDelay }: { children: React.ReactNode, className?: string, animationDelay?: string }) => (
  <div
    className={cn(
        "absolute text-5xl text-white/10 blur-sm animate-float",
        className
    )}
    style={{ animationDelay }}
  >
      {children}
  </div>
);

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const { ref: whyRef, inView: whyInView } = useInView({ triggerOnce: true, threshold: 0.2 });


  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-xl text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#142317]">
        <main className="flex-grow">
          {/* Hero Section */}
          <section
            ref={heroRef}
            className="relative text-center py-24 md:py-32 overflow-hidden bg-gradient-to-b from-[#1A2C1F] to-[#142317]"
          >
             <div className="absolute inset-0 bg-grid-white/[0.05]"></div>

            {/* Floating Icons */}
            <FloatingIcon className="top-[10%] left-[5%]">🍛</FloatingIcon>
            <FloatingIcon className="top-[20%] right-[10%]" animationDelay="2s">🍴</FloatingIcon>
            <FloatingIcon className="bottom-[15%] left-[20%]" animationDelay="4s">📝</FloatingIcon>
            <FloatingIcon className="bottom-[10%] right-[25%]" animationDelay="6s">💰</FloatingIcon>
            <FloatingIcon className="top-[50%] left-[15%]" animationDelay="1s">🏠</FloatingIcon>

            <div className="container relative p-4 space-y-6 max-w-4xl mx-auto flex flex-col items-center">
              <div
                className={cn(
                  "relative transition-all duration-700 ease-out mb-4",
                  heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                )}
                style={{ transitionDelay: '100ms'}}
              >
                  <Logo isMascotAnimated={true} mascotSize="large" isStacked={true} textSize="large" />
              </div>
              <div className="relative [text-shadow:_0_4px_30px_rgba(0,0,0,0.5)]">
                 <p
                  className={cn(
                    "text-lg text-muted-foreground transition-all duration-700 ease-out",
                     heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  )}
                  style={{ transitionDelay: '200ms' }}
                 >
                   The smart roommate manager for bachelors, hostels, and shared flats.
                 </p>
                <h1
                  className={cn(
                    "text-4xl md:text-5xl font-bold font-headline text-white mt-2 transition-all duration-700 ease-out",
                    heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  )}
                  style={{ transitionDelay: '300ms' }}
                >
                  BachelorBite won’t cook for you, but it’ll make your messy life easier.
                </h1>
                <p
                  className={cn(
                    "text-lg md:text-xl text-muted-foreground mt-4 transition-all duration-700 ease-out",
                    heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  )}
                  style={{ transitionDelay: '400ms' }}
                >
                  We can’t fix your love life, but your meal plan? Done.
                </p>
              </div>

              <div
                className={cn(
                  "pt-6 transition-all duration-700 ease-out",
                  heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                )}
                style={{ transitionDelay: '500ms' }}
              >
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-green-400 text-slate-800 font-bold text-lg px-8 py-6 rounded-full transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-primary/30 animate-pulse-slow">
                  <Link href="/login">
                    Your Move. <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Why BachelorBite Section */}
          <section ref={whyRef} className="py-24 md:py-32 bg-gradient-to-b from-[#1E3A28] to-[#162A1C]">
             <div className="container text-center max-w-3xl mx-auto">
                 <div
                    className={cn(
                      "transition-all duration-700 ease-out",
                      whyInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    )}
                  >
                    <h2 className="text-3xl md:text-4xl font-bold font-headline text-white mb-4">Why BachelorBite?</h2>
                    <p className="text-lg text-muted-foreground mb-4">
                        A simple way to keep meals and money under control.
                    </p>
                    <p className="text-xl font-semibold text-primary">
                      Skip the heartbreaks, count the meals. ❤️🍛
                    </p>
                 </div>
             </div>
          </section>

        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <p className="text-xl text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
