
"use client";

import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import { ThemeSwitcher } from "../settings/theme-switcher";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function LandingHeader() {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  return (
    <header className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        hasScrolled ? "bg-background/80 backdrop-blur-sm border-b" : "bg-transparent border-b-transparent"
      )}>
      <div className="container flex h-20 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo />
          </Link>
        </div>
        
        <div className="md:hidden flex-1">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center gap-4">
             <ThemeSwitcher />
             <Button asChild variant="ghost" className="hidden md:inline-flex text-foreground hover:bg-foreground/10 hover:text-foreground">
                <Link href="/login">Sign In</Link>
             </Button>
             <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/signup">
                    Sign Up <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
             </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
