
"use client";

import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { UserNav } from "@/app/(app)/user-nav";
import { NavLink } from "./nav-link";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, MessageCircle, LayoutDashboard, BarChart3, Package, LogOut } from "lucide-react";
import { useUser, useDoc } from "@/firebase";
import { Skeleton } from "../ui/skeleton";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { auth, firestore } from "@/firebase/config";
import { useRouter } from "next/navigation";
import { NotificationBell } from "./notification-bell";
import { doc } from "firebase/firestore";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { Badge } from "../ui/badge";

export function AppHeader() {
  const { user, isUserLoading } = useUser();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  const userDocRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user]);
  const { data: userData } = useDoc(userDocRef);
  const groupId = userData?.groupId;

  const { unreadCount } = useUnreadMessages(groupId, user?.uid);


  useEffect(() => {
    setIsClient(true);
  }, []);


  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/report", label: "Monthly Report", icon: BarChart3 },
    { href: "/inventory", label: "Inventory", icon: Package },
    { href: "/chat", label: "Chat", icon: MessageCircle, notificationCount: unreadCount },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const renderUserSection = () => {
    if (isUserLoading) {
      return <Skeleton className="h-9 w-20 rounded-full" />;
    }
    return (
      <>
        <NotificationBell />
        <Button variant="ghost" size="icon" asChild className="relative">
          <Link href="/chat">
            <MessageCircle />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute top-0 right-0 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
            )}
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
           <SheetHeader>
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <div className="flex flex-col gap-4 py-6">
                <div className="px-4 mb-4">
                <Logo className="light-theme-logo" />
                </div>
                <nav className="flex flex-col gap-2 px-4">
                {navLinks.map((link) => (
                    <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary text-base font-medium"
                    >
                    <div className="flex items-center gap-3">
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </div>
                    {link.notificationCount && link.notificationCount > 0 && (
                      <Badge variant="destructive">{link.notificationCount}</Badge>
                    )}
                    </Link>
                ))}
                </nav>
            </div>
            <div className="mt-auto p-4 border-t border-border">
                 <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary text-base font-medium"
                >
                    <LogOut className="h-5 w-5" />
                    Log Out
                </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b",
      "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    )}>
      <div className="container flex h-16 items-center">
        
        {/* Unified Nav Menu */}
        <div className="mr-4">
          {isClient && renderNavMenu()}
        </div>

        {/* Logo in the middle for desktop */}
        <div className="hidden md:flex flex-1 items-center justify-center">
            <Logo className="light-theme-logo" />
        </div>

        {/* Logo for mobile */}
        <div className="md:hidden flex-1">
          <Logo className="light-theme-logo" />
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
