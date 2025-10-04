"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Logo } from "@/components/icons/logo";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-8 max-w-2xl mx-auto px-4">
        <div className="flex justify-center">
            <Logo isStacked />
        </div>
        <div className="space-y-4">
          <h1 className="text-5xl font-bold font-headline text-foreground">
            Welcome to NourishTrack
          </h1>
          <p className="text-xl text-muted-foreground">
            Your journey to simplified meal and expense tracking starts here.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button asChild size="lg">
            <Link href="/login">
              Get Started
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
