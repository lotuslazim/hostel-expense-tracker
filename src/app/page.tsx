
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Utensils, Scale } from "lucide-react";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import React, { useEffect, Suspense, lazy } from "react";
import { Logo } from "@/components/icons/logo";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const Dialog = lazy(() => import('@/components/ui/dialog').then(module => ({ default: module.Dialog })));
const DialogContent = lazy(() => import('@/components/ui/dialog').then(module => ({ default: module.DialogContent })));
const DialogTrigger = lazy(() => import('@/components/ui/dialog').then(module => ({ default: module.DialogTrigger })));
const DialogHeader = lazy(() => import('@/components/ui/dialog').then(module => ({ default: module.DialogHeader })));
const DialogTitle = lazy(() => import('@/components/ui/dialog').then(module => ({ default: module.DialogTitle })));


const FloatingIcon = ({ children, className, animationDelay }: { children: React.ReactNode, className?: string, animationDelay?: string }) => (
  <div
    className={cn(
        "absolute text-5xl animate-float text-white/30",
        className
    )}
    style={{ animationDelay }}
  >
      {children}
  </div>
);

const FeatureCard = ({ icon, title, description, imageSrc }: { icon: React.ReactNode, title: string, description: string, imageSrc: string }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  return (
    <Card
      ref={ref}
      className={cn(
        "bg-white/5 border-white/10 text-center p-6 transform transition-all duration-500 flex flex-col",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
    >
      <CardHeader className="items-center">
        <Suspense fallback={<Skeleton className="w-full aspect-video rounded-lg" />}>
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative w-full mb-4 rounded-lg overflow-hidden aspect-video cursor-zoom-in group">
                <Image 
                  src={imageSrc} 
                  alt={title} 
                  fill 
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-6xl p-0">
               <DialogHeader className="p-4">
                  <DialogTitle className="sr-only">{title} - Fullscreen View</DialogTitle>
               </DialogHeader>
               <Image 
                  src={imageSrc} 
                  alt={title} 
                  width={1920}
                  height={1080}
                  className="rounded-b-lg object-contain w-full h-auto"
                />
            </DialogContent>
          </Dialog>
        </Suspense>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-white/80">{description}</p>
      </CardContent>
    </Card>
  )
}

const StepCard = ({ number, title, description, delay }: { number: string, title: string, description: string, delay: string }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center text-center gap-4 transition-all duration-700 ease-out",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: delay }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-2xl border-2 border-primary/50 shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-bold text-xl text-white">{title}</h4>
        <p className="text-white/80 mt-1">{description}</p>
      </div>
    </div>
  );
};


export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const { ref: whyRef, inView: whyInView } = useInView({ triggerOnce: true, threshold: 0.2 });
  const { ref: howRef, inView: howInView } = useInView({ triggerOnce: true, threshold: 0.2 });
  const { ref: previewRef, inView: previewInView } = useInView({ triggerOnce: true, threshold: 0.2 });
  const { ref: ctaRef, inView: ctaInView } = useInView({ triggerOnce: true, threshold: 0.2 });
  
  const appPreviewImage = PlaceHolderImages.find(p => p.id === 'app-preview');

  useEffect(() => {
    // Wait until loading is complete before trying to redirect.
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);


  if (isUserLoading || user) { // Keep showing loading screen until not loading AND user is null
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] text-white p-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05]"></div>
         {/* Floating Icons */}
          <FloatingIcon className="top-[10%] left-[5%]" animationDelay="0s">🍛</FloatingIcon>
          <FloatingIcon className="top-[20%] right-[10%]" animationDelay="1s">💰</FloatingIcon>
          <FloatingIcon className="bottom-[25%] left-[15%]" animationDelay="2s">📝</FloatingIcon>
          <FloatingIcon className="bottom-[10%] right-[20%]" animationDelay="3s">🍴</FloatingIcon>
          <FloatingIcon className="top-[50%] left-[25%]" animationDelay="4s">🍛</FloatingIcon>
          <FloatingIcon className="top-[60%] right-[30%]" animationDelay="5s">💰</FloatingIcon>

        <div className="relative text-center space-y-6 z-10">
            <p className="text-2xl md:text-3xl font-medium animate-fade-in-scale [animation-delay:200ms]">
                Take a breath. 🌿
            </p>
             <p className="text-xl md:text-2xl font-light text-white/80 animate-fade-in-scale [animation-delay:400ms]">
                You’re right where you need to be.
            </p>
            <div className="animate-fade-in-scale [animation-delay:600ms]">
                <Logo isMascotAnimated={true} mascotSize="large" isStacked={true} textSize="large" textColor="text-white" />
            </div>
            <div className="flex items-center justify-center gap-1.5 pt-4 animate-fade-in-scale [animation-delay:800ms]">
                <span className="h-2.5 w-2.5 rounded-full bg-white/80 animate-loading-dot [animation-delay:0.0s]"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-white/80 animate-loading-dot [animation-delay:0.2s]"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-white/80 animate-loading-dot [animation-delay:0.4s]"></span>
            </div>
        </div>
      </div>
    );
  }

  // Only render the landing page if loading is complete and there's no user.
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
          <FloatingIcon className="top-[10%] left-[5%]" animationDelay="0s">🍛</FloatingIcon>
          <FloatingIcon className="top-[20%] right-[10%]" animationDelay="1s">💰</FloatingIcon>
          <FloatingIcon className="bottom-[25%] left-[15%]" animationDelay="2s">📝</FloatingIcon>
          <FloatingIcon className="bottom-[10%] right-[20%]" animationDelay="3s">🍴</FloatingIcon>
          <FloatingIcon className="top-[50%] left-[25%]" animationDelay="4s">🍛</FloatingIcon>
          <FloatingIcon className="top-[60%] right-[30%]" animationDelay="5s">💰</FloatingIcon>

          <div className="container relative p-4 space-y-4 max-w-3xl mx-auto flex flex-col items-center">
            <div
              className={cn(
                "relative transition-all duration-700 ease-out [filter:drop-shadow(0_4px_8px_rgba(0,0,0,0.5))]",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              )}
              style={{ transitionDelay: '100ms'}}
            >
                <Logo isMascotAnimated={true} mascotSize="large" isStacked={true} textSize="large" textColor="text-white" />
            </div>
            <p
              className={cn(
                "text-base text-white/80 transition-all duration-700 ease-out",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              )}
              style={{ transitionDelay: '200ms' }}
            >
              No notes, no Excel—just one tap, done.
            </p>
            <div className="relative [text-shadow:_0_4px_30px_rgba(0,0,0,0.5)]">
              <h1
                className={cn(
                  "text-3xl md:text-4xl font-bold font-headline text-white mt-4 transition-all duration-700 ease-out",
                  heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                )}
                style={{ transitionDelay: '300ms' }}
              >
                Here to make your bachelor life easier — because someone has to. 😌
              </h1>
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
                <p
                className={cn(
                  "text-lg md:text-xl text-white/80 mt-4 transition-all duration-700 ease-out",
                  heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                )}
                style={{ transitionDelay: '600ms' }}
              >
                Love might ditch you sometimes — I won’t.
              </p>
            </div>
          </div>
        </section>

          {/* Why BachelorBite Section */}
        <section ref={whyRef} className="py-24 md:py-32 bg-gradient-to-b from-[#1E3A28] to-[#162A1C]">
            <div className="container text-center max-w-4xl mx-auto">
                <div
                  className={cn(
                    "transition-all duration-700 ease-out",
                    whyInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  )}
                >
                  <h2 className="text-3xl md:text-4xl font-bold font-headline text-white mb-2">Why BachelorBite?</h2>
                  <p className="text-lg text-muted-foreground mb-4">A simple way to keep meals and money under control.</p>
                  <p className="text-lg text-white/80 max-w-2xl mx-auto">
                      Because hostel and bachelor life is chaotic enough — tracking meals and money shouldn’t be. BachelorBite is your all-in-one roommate manager. It helps you keep track of who ate, who paid, and who owes. No spreadsheets, no awkward reminders, just harmony in the kitchen.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left">
                  <FeatureCard 
                    icon={<Utensils />} 
                    title="Daily Meal Logging"
                    description="Easily log who’s eating and when — so you only cook what you need."
                    imageSrc={'/dashboadjpg.jpg'}
                  />
                  <FeatureCard 
                    icon={<div className="h-6 w-6 flex items-center justify-center text-3xl font-bold">৳</div>} 
                    title="Expense Tracking"
                    description="Split bills for groceries, gas, and utilities. Upload receipts to keep things official."
                    imageSrc={'/addexpense.jpg'}
                  />
                  <FeatureCard 
                    icon={<Scale />} 
                    title="Final Settlement"
                    description="Get a clear breakdown of who owes what at the end of the month. No more math headaches."
                    imageSrc={'/finalsatelment.jpg'}
                  />
                </div>
            </div>
        </section>

          {/* How It Works Section */}
          <section ref={howRef} className="py-24 md:py-32 bg-[#142317]">
            <div className="container max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold font-headline text-white mb-12">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                  <StepCard number="1" title="Create or Join a Group" description="Start a new household or join your roommates using a simple invite code." delay="100ms" />
                  <StepCard number="2" title="Log Meals & Expenses" description="Just a few seconds a day to log meals and shared expenses you’ve paid." delay="200ms" />
                  <StepCard number="3" title="Settle Up" description="End of the month, get a clean breakdown of who owes what — no more awkward math." delay="300ms" />
                </div>
            </div>
          </section>

          {/* App Preview Section */}
          <section ref={previewRef} className="py-24 md:py-32 bg-gradient-to-b from-[#1E3A28] to-[#162A1C]">
              <div className="container max-w-4xl mx-auto text-center">
                    <div
                      className={cn(
                      "relative w-full max-w-3xl mx-auto aspect-video rounded-xl shadow-2xl shadow-black/50 overflow-hidden transform transition-all duration-700 ease-out",
                      previewInView ? "opacity-100 scale-120" : "opacity-0 scale-100"
                      )}
                  >
                      {appPreviewImage && <Image src={appPreviewImage.imageUrl} alt={appPreviewImage.description} fill className="object-cover" priority />}
                  </div>
                  <p className={cn(
                      "mt-6 text-muted-foreground italic transition-all duration-500 ease-out",
                      previewInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
                  )} style={{ transitionDelay: '200ms'}}>
                      A peek inside BachelorBite. Simple. Organized. Satisfying.
                  </p>
              </div>
          </section>

          {/* Final CTA Section */}
          <section ref={ctaRef} className="py-24 md:py-32 bg-mint-500 text-center">
              <div className="container max-w-2xl mx-auto">
                  <h3 className={cn(
                      "text-3xl md:text-4xl font-bold font-headline text-slate-900 transition-all duration-700 ease-out",
                      ctaInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                      )}
                  >
                      Ready to end the chaos? 🍳
                  </h3>
                  <p className={cn(
                      "text-lg text-slate-700 mt-4 mb-8 transition-all duration-700 ease-out",
                      ctaInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                      )} style={{ transitionDelay: '200ms' }}
                  >
                      It’s free to use and takes less than a minute to get started. Your roommates will thank you (probably).
                  </p>
                  <div
                      className={cn(
                      "mt-8 transition-all duration-700 ease-out",
                      ctaInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                      )}
                      style={{ transitionDelay: '400ms' }}
                  >
                      <Button asChild size="lg" className="bg-slate-900 text-white font-bold text-lg px-8 py-6 rounded-full transition-all duration-300 ease-in-out hover:scale-105 hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/40">
                      <Link href="/login">
                          Sign Up for Free <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                      </Button>
                  </div>
                    <div className="mt-16 text-slate-600">
                      <p className="font-semibold text-lg text-slate-700">Skip the heartbreaks, count the meals. ❤️🍛</p>
                        <hr className="w-1/2 mx-auto my-6 opacity-20 border-slate-700" />
                      <p className="text-sm">
                          📧 Contact: <a href="mailto:lotuslazim@gmail.com" className="underline hover:text-slate-900">lotuslazim@gmail.com</a>
                      </p>
                  </div>
              </div>
          </section>

      </main>
    </div>
  );
}
