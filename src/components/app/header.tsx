
"use client";

import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { UserNav } from "@/components/app/user-nav";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, MessageCircle, LayoutDashboard, BarChart3, Package, LogOut } from "lucide-react";
import { useUser, useDoc } from "@/firebase";
import { Skeleton } from "../ui/skeleton";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { auth, firestore } from "@/firebase/config";
import { usePathname, useRouter } from "next/navigation";
import { NotificationBell } from "./notification-bell";
import { doc } from "firebase/firestore";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { Badge } from "../ui/badge";

export function AppHeader() {
  const { user, isUserLoading } = useUser();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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
        <UserNav />
      </>
    );
  };
  
  const renderNavMenu = () => {
    if (!user) return null;
    return (
      <Sheet>
        <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu />
              <span className="sr-only">Open Menu</span>
            </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
              <SheetTitle>
                  <Logo />
              </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full py-4">
              <nav className="flex flex-col gap-2 flex-grow">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                    {link.notificationCount && link.notificationCount > 0 && (
                      <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                        {link.notificationCount}
                      </Badge>
                    )}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto">
                 <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-muted-foreground">
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
        
        <div className="flex items-center gap-4">
          {renderNavMenu()}
          <Logo className="light-theme-logo" />
        </div>

        <div className="flex-1 flex items-center justify-end space-x-1 md:space-x-2">
           <div className="flex items-center space-x-1">
            {renderUserSection()}
           </div>
        </div>
      </div>
    </header>
  );
}
