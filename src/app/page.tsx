
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/icons/logo";
import placeholderImages from "@/lib/placeholder-images.json";

export default function LandingPage() {
  const heroImage = placeholderImages.placeholderImages.find(p => p.id === "landing-hero");

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
                  <div className="scale-150">
                    <Logo />
                  </div>
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
        </section>
      </main>
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} BachelorBite. All rights reserved.</p>
      </footer>
    </div>
  );
}
