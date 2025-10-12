
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Utensils, Wallet, MessageSquare } from "lucide-react";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/icons/logo";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { LandingHeader } from "@/components/app/landing-header";

const FeatureCard = ({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: string }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  return (
    <div
      ref={ref}
      className={cn(
        "bg-card/50 backdrop-blur-sm p-6 rounded-lg text-center transition-all duration-700 ease-out",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: delay }}
    >
      <div className="inline-block bg-primary/10 text-primary p-3 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold font-headline mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

const Step = ({ number, title, description, delay }: { number: string, title: string, description: string, delay: string }) => {
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
    return (
        <div
            ref={ref}
            className={cn(
                "flex items-start gap-4 transition-all duration-700 ease-out",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            )}
            style={{ transitionDelay: delay }}
        >
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground font-bold text-xl font-headline shrink-0">
                {number}
            </div>
            <div>
                <h3 className="text-xl font-bold font-headline mb-1">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}

const FloatingIcon = ({ children, className, animationDelay }: { children: React.ReactNode, className?: string, animationDelay?: string }) => (
    <div 
      className={cn(
          "absolute text-5xl opacity-10 text-white animate-float",
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
  const { ref: featuresRef, inView: featuresInView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const { ref: stepsRef, inView: stepsInView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const { ref: ctaRef, inView: ctaInView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const howItWorksImage = PlaceHolderImages.find(p => p.id === "landing-how-it-works");

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
      <div className="min-h-screen flex flex-col bg-background">
        <LandingHeader />
        <main className="flex-grow">
          {/* Hero Section */}
          <section 
            ref={heroRef} 
            className="relative text-center py-24 md:py-32 overflow-hidden bg-gradient-to-br from-[#253D2C] to-[#435E49]"
          >
            <div className="absolute inset-0 bg-black/20"></div>

            {/* Floating Icons */}
            <FloatingIcon className="top-[10%] left-[5%]">🍛</FloatingIcon>
            <FloatingIcon className="top-[20%] right-[10%]" animationDelay="2s">🍴</FloatingIcon>
            <FloatingIcon className="bottom-[15%] left-[20%]" animationDelay="4s">🧾</FloatingIcon>
            <FloatingIcon className="bottom-[10%] right-[25%]" animationDelay="6s">💵</FloatingIcon>

            <div className="container relative p-4 space-y-4 max-w-3xl mx-auto flex flex-col items-center">
              <div 
                className={cn(
                  "relative transition-opacity duration-1000 ease-out mb-4",
                  heroInView ? "opacity-100" : "opacity-0"
                )}
              >
                  <Logo isMascotAnimated={true} mascotSize="large" />
              </div>
              <div className="relative [text-shadow:_0_4px_30px_rgba(0,0,0,0.4)]">
                <h1 
                  className={cn(
                    "text-3xl md:text-4xl font-bold font-headline text-white transition-all duration-700 ease-out",
                    heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  )}
                  style={{ transitionDelay: '200ms' }}
                >
                  BachelorBite won’t cook for you, but it’ll make your messy life easier.
                </h1>
                <p 
                  className={cn(
                    "text-lg md:text-xl text-gray-300 mt-4 transition-all duration-700 ease-out",
                    heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  )}
                  style={{ transitionDelay: '400ms' }}
                >
                  Skip the heartbreaks, count the meals.
                </p>
              </div>

              <div 
                className={cn(
                  "pt-6 transition-all duration-700 ease-out",
                  heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                )}
                style={{ transitionDelay: '600ms' }}
              >
                <Button asChild size="lg" className="bg-gradient-to-r from-mint-500 to-green-400 text-slate-800 font-bold text-lg px-8 py-6 rounded-full transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-mint-500/30 animate-pulse-slow">
                  <Link href="/login">
                    Your Move. <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section ref={featuresRef} className="py-16 md:py-24 bg-background/50 dark:bg-black/20">
              <div className="container">
                   <h2 className="text-3xl font-bold text-center mb-12 font-headline">Everything you need to manage your den.</h2>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <FeatureCard
                           icon={<Utensils size={24} />}
                           title="Daily Meal Logging"
                           description="Easily log who's eating and when, so you only cook what you need."
                           delay="100ms"
                       />
                       <FeatureCard
                           icon={<Wallet size={24} />}
                           title="Expense Tracking"
                           description="Split bills for groceries, utilities, and more. Upload receipts to keep it official."
                           delay="200ms"
                       />
                       <FeatureCard
                           icon={<MessageSquare size={24} />}
                           title="Group Chat"
                           description="Coordinate plans, share shopping lists, or just send memes. It all happens here."
                           delay="300ms"
                       />
                   </div>
              </div>
          </section>

          {/* How It Works Section */}
          <section ref={stepsRef} className="py-16 md:py-24">
              <div className="container grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                      <Step number="1" title="Create or Join a Group" description="Start a new household or join your roommates with a simple invite code." delay="100ms" />
                      <Step number="2" title="Log Meals & Expenses" description="Take a few seconds each day to log your meals and any shared expenses you've paid for." delay="200ms" />
                      <Step number="3" title="Settle Up" description="At the end of the month, see a clear breakdown of who owes what. No more awkward math." delay="300ms" />
                  </div>
                  <div className={cn("hidden md:block transition-all duration-700 ease-out", stepsInView ? "opacity-100 scale-100" : "opacity-0 scale-90")} style={{transitionDelay: '400ms'}}>
                    {howItWorksImage ? (
                      <img src={howItWorksImage.imageUrl} alt={howItWorksImage.description} className="rounded-lg shadow-xl" data-ai-hint={howItWorksImage.imageHint} />
                    ) : (
                      <div className="bg-muted rounded-lg shadow-xl aspect-[6/5]"></div>
                    )}
                  </div>
              </div>
          </section>

           {/* Final CTA */}
          <section ref={ctaRef} className="py-16 md:py-24 text-center bg-background/50 dark:bg-black/20">
              <div className="container max-w-2xl">
                   <div className={cn("transition-all duration-700 ease-out", ctaInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>
                     <h2 className="text-3xl font-bold font-headline mb-4">Ready to end the chaos?</h2>
                     <p className="text-muted-foreground mb-8">
                         It's free to use and takes less than a minute to get started. Your roommates will thank you (probably).
                     </p>
                     <Button asChild size="lg" className="bg-primary text-primary-foreground text-lg px-8 py-6 rounded-full transition-transform duration-300 ease-in-out hover:scale-105">
                        <Link href="/signup">
                            Sign Up for Free <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
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
