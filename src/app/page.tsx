
"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";
import { Logo } from "@/components/icons/logo";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";

function ClientOnlyContent() {
  const [clientTime, setClientTime] = useState<string | null>(null);

  useEffect(() => {
    // This code runs only on the client, after the initial server render.
    // This is the correct place for browser-specific logic or dynamic values.
    if (typeof window !== 'undefined') {
       setClientTime(new Date().toLocaleTimeString());
    }
  }, []);

  return (
    <Card className="mt-12 max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Clock /> Client-Only Content
        </CardTitle>
        <CardDescription>
          This card demonstrates how to prevent hydration errors by rendering dynamic content only on the client-side.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-medium">
          Current Client Time: {clientTime ? clientTime : "Loading..."}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          The server-rendered HTML for this part is "Loading...". The actual time is filled in by a `useEffect` hook on the client, avoiding a server-client mismatch.
        </p>
      </CardContent>
    </Card>
  );
}

function FooterYear() {
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return <span>{year}</span>;
}


export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(p => p.id === "landing-hero");

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </header>
      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-1 gap-12 items-center text-center">
            <div className="space-y-6">
              <div className="flex justify-center mb-8">
                <div className="w-48 h-48 bg-card rounded-full flex items-center justify-center shadow-lg">
                  <Logo isStacked={true} />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter font-headline">
                Track meals, not heartbreaks.
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                We can’t cook for you, but we can make your bachelor life a little less messy.
              </p>
              <Button size="lg" asChild>
                <Link href="/signup">
                  Get Started Free <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
          <ClientOnlyContent />
        </section>
      </main>
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground text-sm">
        <p>&copy; <FooterYear /> BachelorBite. All rights reserved.</p>
      </footer>
    </div>
  );
}
