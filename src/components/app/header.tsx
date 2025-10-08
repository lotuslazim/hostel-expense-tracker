
"use client";

import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { UserNav } from "@/app/(app)/user-nav";
import { NavLink } from "./nav-link";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, MessageSquare, LayoutDashboard, BarChart3, Package } from "lucide-react";
import { useUser } from "@/firebase";
import { Skeleton } from "../ui/skeleton";
import { useState, useEffect } from "react";

export function AppHeader() {
  const { isUserLoading } = useUser();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/report", label: "Monthly Report", icon: BarChart3 },
    { href: "/inventory", label: "Inventory", icon: Package },
  ];

  const renderUserSection = () => {
    if (isUserLoading) {
      return <Skeleton className="h-9 w-20 rounded-full" />;
    }
    return (
      <>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/chat">
            <MessageSquare />
            <span className="sr-only">Open Chat</span>
          </Link>
        </Button>
        <UserNav />
      </>
    );
  };
  
  const renderNavMenu = () => {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[350px]">
          <div className="flex flex-col gap-4 py-6">
            <div className="px-4 mb-4">
              <Logo />
            </div>
            <nav className="flex flex-col gap-2 px-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary text-base font-medium"
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        
        {/* Unified Nav Menu */}
        <div className="mr-4">
          {renderNavMenu()}
        </div>

        {/* Logo in the middle for desktop */}
        <div className="hidden md:flex flex-1 items-center justify-center">
            <Logo />
        </div>

        {/* Logo for mobile */}
        <div className="md:hidden flex-1">
          <Logo />
        </div>

        {/* Right side icons */}
        <div className="flex items-center justify-end space-x-2">
           <div className="flex items-center space-x-2">
            {renderUserSection()}
           </div>
        </div>
      </div>
    </header>
  );
}
