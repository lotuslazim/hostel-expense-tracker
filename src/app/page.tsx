
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LandingHeader } from "@/components/app/landing-header";
import { Logo } from "@/components/icons/logo";


export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);


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
            <div className="p-4 space-y-4 max-w-3xl mx-auto flex flex-col items-center">
                <Logo isStacked />
                <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground">
                    BachelorBite won’t cook for you, but it’ll make your messy life easier.
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground">
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
