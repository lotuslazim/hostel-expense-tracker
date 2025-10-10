
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LandingHeader } from "@/components/app/landing-header";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const heroImage = PlaceHolderImages.find(p => p.id === 'landing-hero');

  if (isUserLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <p className="text-xl text-muted-foreground">Loading...</p>
            </div>
        </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <LandingHeader />
        <main className="flex-grow flex items-center justify-center text-center">
            <div className="absolute inset-0 z-0">
                {heroImage && (
                    <Image
                        src={heroImage.imageUrl}
                        alt={heroImage.description}
                        fill
                        className="object-cover"
                        data-ai-hint={heroImage.imageHint}
                        priority
                    />
                )}
                <div className="absolute inset-0 bg-black/60"></div>
            </div>
            <div className="relative z-10 text-white p-4 space-y-6 max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-bold font-headline drop-shadow-md">
                    BachelorBite won’t cook for you, but it’ll make your messy life easier.
                </h1>
                <p className="text-lg md:text-2xl text-white/80 drop-shadow-sm">
                    Skip the heartbreaks, count the meals.
                </p>
                <div className="pt-4">
                    <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 rounded-full">
                        <Link href="/login">
                            Get Started <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
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
