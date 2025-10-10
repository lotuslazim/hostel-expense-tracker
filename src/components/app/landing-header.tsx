
"use client";

import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import { ThemeSwitcher } from "../settings/theme-switcher";

export function LandingHeader() {
  return (
    <header className="absolute top-0 z-50 w-full">
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
             <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                <Link href="/login">Sign In</Link>
             </Button>
             <Button asChild className="hidden md:inline-flex bg-primary text-primary-foreground hover:bg-primary/90">
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
