import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/icons/logo";
import placeholderImages from "@/lib/placeholder-images.json";

export default function LandingPage() {
  const heroImage = {
    imageUrl: "https://media.tenor.com/bC2F2I2x00cAAAAC/umaru-chan-eating.gif",
    description: "Anime character eating noodles",
    imageHint: "anime eating"
  };

  return (
    <div className="flex flex-col min-h-screen">
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
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter font-headline">
                Hey, Gorom Chele
              </h1>
              <p className="text-lg text-muted-foreground">
                Welcome to the upgrade! Track your meals, stack your stats, and stay on top—smooth, simple, done.
              </p>
              <Button size="lg" asChild>
                <Link href="/signup">
                  Get Started Free <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
            <div className="relative h-80 w-full md:h-full rounded-lg overflow-hidden shadow-xl">
              {heroImage && (
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="bg-muted"
                  data-ai-hint={heroImage.imageHint}
                  unoptimized // Add this prop for GIFs
                />
              )}
            </div>
          </div>
        </section>
      </main>
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Meal Calculator. All rights reserved.</p>
      </footer>
    </div>
  );
}
