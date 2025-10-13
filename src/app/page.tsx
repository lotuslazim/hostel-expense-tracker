
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Utensils, IndianRupee, MessageSquare, CheckCircle } from "lucide-react";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/icons/logo";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";


const FloatingIcon = ({ children, className, animationDelay }: { children: React.ReactNode, className?: string, animationDelay?: string }) => (
  <div
    className={cn(
        "absolute text-5xl text-white/20 animate-float",
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
        "bg-white/5 border-white/10 text-center p-6 transform transition-all duration-500",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
    >
      <CardHeader className="items-center">
         <div className="relative h-40 w-full mb-4 rounded-lg overflow-hidden">
          <Image src={imageSrc} alt={title} layout="fill" objectFit="cover" className="transition-transform duration-300 group-hover:scale-105" />
        </div>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
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
        <p className="text-muted-foreground mt-1">{description}</p>
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
            <FloatingIcon className="top-[10%] left-[5%]" animationDelay="0s">🍛</FloatingIcon>
            <FloatingIcon className="top-[20%] right-[10%]" animationDelay="1s">💰</FloatingIcon>
            <FloatingIcon className="bottom-[25%] left-[15%]" animationDelay="2s">📝</FloatingIcon>
            <FloatingIcon className="bottom-[10%] right-[20%]" animationDelay="3s">🍴</FloatingIcon>
            <FloatingIcon className="top-[50%] left-[25%]" animationDelay="4s">🍛</FloatingIcon>
            <FloatingIcon className="top-[60%] right-[30%]" animationDelay="5s">💰</FloatingIcon>

            <div className="container relative p-4 space-y-4 max-w-3xl mx-auto flex flex-col items-center">
              <div
                className={cn(
                  "relative transition-all duration-700 ease-out",
                  heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                )}
                style={{ transitionDelay: '100ms'}}
              >
                  <Logo isMascotAnimated={false} mascotSize="large" isStacked={true} textSize="large" />
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
                    "text-4xl md:text-5xl font-bold font-headline text-white mt-2 transition-all duration-700 ease-out",
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
                    "text-lg md:text-xl text-muted-foreground mt-4 transition-all duration-700 ease-out",
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
                      imageSrc={PlaceHolderImages.find(p => p.id === 'app-dashboard')?.imageUrl || ''}
                    />
                    <FeatureCard 
                      icon={<IndianRupee />} 
                      title="Expense Tracking"
                      description="Split bills for groceries, gas, and utilities. Upload receipts to keep things official."
                      imageSrc={PlaceHolderImages.find(p => p.id === 'app-report')?.imageUrl || ''}
                    />
                    <FeatureCard 
                      icon={<MessageSquare />} 
                      title="Group Chat"
                      description="Coordinate plans, share shopping lists, or just send memes. It all happens here."
                      imageSrc={PlaceHolderImages.find(p => p.id === 'app-inventory')?.imageUrl || ''}
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
            {appPreviewImage && (
                <section ref={previewRef} className="py-24 md:py-32 bg-gradient-to-b from-[#1E3A28] to-[#162A1C]">
                    <div className="container max-w-4xl mx-auto text-center">
                         <div
                            className={cn(
                            "relative w-full max-w-3xl mx-auto aspect-video rounded-xl shadow-2xl shadow-black/50 overflow-hidden transform transition-all duration-700 ease-out",
                            previewInView ? "opacity-100 scale-100" : "opacity-0 scale-90"
                            )}
                        >
                            <Image src={appPreviewImage.imageUrl} alt={appPreviewImage.description} layout="fill" objectFit="cover" />
                        </div>
                        <p className={cn(
                            "mt-6 text-muted-foreground italic transition-all duration-500 ease-out",
                            previewInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
                        )} style={{ transitionDelay: '200ms'}}>
                           A peek inside BachelorBite. Simple. Organized. Satisfying.
                        </p>
                    </div>
                </section>
            )}

            {/* Final CTA Section */}
            <section ref={ctaRef} className="py-24 md:py-32 bg-mint-500 text-center">
                <div className="container max-w-2xl mx-auto">
                    <h3 className={cn(
                        "text-3xl md:text-4xl font-bold font-headline text-slate-800 transition-all duration-700 ease-out",
                        ctaInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                        )}
                    >
                        Ready to end the chaos?
                    </h3>
                    <p className={cn(
                        "text-lg text-slate-600 mt-4 transition-all duration-700 ease-out",
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
                        <Button asChild size="lg" className="bg-slate-900 text-white font-bold text-lg px-8 py-6 rounded-full transition-all duration-300 ease-in-out hover:scale-105 hover:bg-slate-800 hover:shadow-lg">
                        <Link href="/signup">
                            Sign Up for Free <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                        </Button>
                    </div>
                     <div className="mt-16 text-slate-600">
                        <p className="font-semibold text-xl">Skip the heartbreaks, count the meals. ❤️🍛</p>
                        <p className="mt-4 text-sm">
                            📩 Contact: <a href="mailto:lotuslazim@gmail.com" className="underline hover:text-slate-800">lotuslazim@gmail.com</a>
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
