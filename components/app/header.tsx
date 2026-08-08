"use client";

import {
  type ElementType,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  BellRing,
  BarChart3,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageCircle,
  Package,
  Scale,
  Settings,
  Shield,
  ShoppingBasket,
  Users,
} from "lucide-react";

import { BackButton } from "@/components/app/back-button";
import { NoticeBoard } from "@/components/app/notice-board";
import { UserNav } from "@/components/app/user-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDoc,
  useUser,
} from "@/firebase";
import {
  auth,
  firestore,
} from "@/firebase/config";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { cn } from "@/lib/utils";

type NavigationItem = {
  href: string;
  label: string;
  icon: ElementType;
  badge?: number;
};

type UserProfileRecord = {
  groupId?: string | null;
  isAdmin?: boolean;
};


function UnevenMenuIcon() {
  return (
    <span
      className="flex h-[22px] w-[24px] flex-col items-start justify-center gap-[4px]"
      aria-hidden="true"
    >
      <span className="h-[2px] w-[20px] rounded-full bg-current" />
      <span className="h-[2px] w-[14px] rounded-full bg-current" />
      <span className="h-[2px] w-[18px] rounded-full bg-current" />
    </span>
  );
}

function BachelorBiteWordmark({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline whitespace-nowrap font-body text-[17px] font-semibold tracking-[-0.035em]",
        className
      )}
    >
      <span className="text-[#f6f8f7]">Bachelor</span>
      <span className="text-[#f6cf58]">Bite</span>
    </span>
  );
}

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const {
    user,
    isUserLoading,
  } = useUser();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [shoppingItemCount, setShoppingItemCount] = useState(0);
  const [urgentShoppingItemCount, setUrgentShoppingItemCount] = useState(0);


  const userDocRef = useMemo(() => {
    if (!user) {
      return null;
    }

    return doc(firestore, "users", user.uid);
  }, [user]);

  const {
    data: userData,
    isLoading: isUserDataLoading,
  } = useDoc<UserProfileRecord>(userDocRef);

  const groupId = userData?.groupId;
  const isUserAdmin = userData?.isAdmin ?? false;

  const { unreadCount } = useUnreadMessages(
    groupId,
    user?.uid
  );

  useEffect(() => {
    if (!groupId) {
      setShoppingItemCount(0);
      setUrgentShoppingItemCount(0);
      return;
    }

    const shoppingItemsRef = collection(
      firestore,
      "groups",
      groupId,
      "shoppingItems"
    );

    const unsubscribe = onSnapshot(
      shoppingItemsRef,
      (snapshot) => {
        const activeItems = snapshot.docs.filter(
          (shoppingItemDocument) => {
            const shoppingItem = shoppingItemDocument.data();

            return shoppingItem.status !== "completed";
          }
        );

        const urgentItems = activeItems.filter(
          (shoppingItemDocument) => {
            const shoppingItem = shoppingItemDocument.data();

            return shoppingItem.priority === "urgent";
          }
        );

        setShoppingItemCount(activeItems.length);
        setUrgentShoppingItemCount(urgentItems.length);
      },
      (error) => {
        console.error(
          "Failed to load shopping alert:",
          error
        );

        setShoppingItemCount(0);
        setUrgentShoppingItemCount(0);
      }
    );

    return unsubscribe;
  }, [groupId]);

  const navigateTo = (path: string) => {
    setIsMenuOpen(false);

    if (pathname !== path) {
      router.push(path);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    setIsMenuOpen(false);

    try {
      await signOut(auth);
      window.location.replace("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      setIsLoggingOut(false);
    }
  };

  const mainLinks: NavigationItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/report",
      label: "Monthly Report",
      icon: BarChart3,
    },
    {
      href: "/chat",
      label: "Chat",
      icon: MessageCircle,
      badge:
        typeof unreadCount === "number"
          ? unreadCount
          : 0,
    },
  ];

  const managementLinks: NavigationItem[] = [
    {
      href: "/admin",
      label: "Group Details",
      icon: Users,
    },
    {
      href: "/inventory",
      label: "Inventory",
      icon: Package,
    },
    {
      href: "/settlements",
      label: "Settlements",
      icon: Scale,
    },
  ];

  const accountLinks: NavigationItem[] = [
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
    },
    {
      href: "/contact",
      label: "Help & Feedback",
      icon: CircleHelp,
    },
  ];

  const isActiveRoute = (href: string) => {
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  const normalizedPathname =
    pathname === "/"
      ? "/"
      : pathname.replace(/\/+$/, "");

  const shouldShowBackRow =
    Boolean(user) &&
    normalizedPathname !== "/dashboard";

  const shouldShowShoppingAlert =
    Boolean(user) &&
    shoppingItemCount > 0 &&
    !isActiveRoute("/shopping-list");

  const renderMenuItem = ({
    href,
    label,
    icon: Icon,
    badge = 0,
  }: NavigationItem) => {
    const isActive = isActiveRoute(href);

    return (
      <Button
        key={href}
        type="button"
        variant="ghost"
        onClick={() => navigateTo(href)}
        className={cn(
          "h-12 w-full justify-start gap-3 rounded-xl px-4 text-[15px]",
          "text-muted-foreground hover:bg-muted hover:text-foreground",
          isActive &&
          "bg-primary/15 font-semibold text-primary hover:bg-primary/20 hover:text-primary"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span>{label}</span>

        {badge > 0 && (
          <Badge className="ml-auto flex min-w-6 items-center justify-center rounded-full px-2">
            {badge > 99 ? "99+" : badge}
          </Badge>
        )}
      </Button>
    );
  };

  const renderUserSection = () => {
    if (isUserLoading || isUserDataLoading) {
      return (
        <div className="flex items-center gap-2">
          <Skeleton className="h-11 w-11 rounded-[14px] bg-white/10" />
          <Skeleton className="h-11 w-11 rounded-full bg-white/10" />
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return (
      <div className="flex items-center gap-2">
        <NoticeBoard />
        <UserNav />
      </div>
    );
  };

  const renderNavigationMenu = () => {
    if (!user) {
      return null;
    }

    return (
      <Sheet
        open={isMenuOpen}
        onOpenChange={(open) => {
          if (!isLoggingOut) {
            setIsMenuOpen(open);
          }
        }}
      >
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Open navigation menu"
            disabled={isLoggingOut}
            className="-ml-1 h-11 w-11 shrink-0 rounded-full border-0 bg-transparent p-0 text-white/95 shadow-none hover:bg-white/[0.06] hover:text-white"
          >
            <UnevenMenuIcon />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="flex w-[86vw] max-w-sm flex-col border-r-border/70 p-0"
        >
          <SheetHeader className="border-b px-5 py-5 text-left">
            <SheetTitle>
              <BachelorBiteWordmark className="text-[20px]" />
            </SheetTitle>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col">
            <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
              <div className="space-y-1">
                <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Main
                </p>
                {mainLinks.map(renderMenuItem)}
              </div>

              <div className="space-y-1 border-t pt-4">
                <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Group & Management
                </p>

                {managementLinks.map(renderMenuItem)}

                {isUserAdmin &&
                  renderMenuItem({
                    href: "/admin-profile",
                    label: "Admin Dashboard",
                    icon: Shield,
                  })}
              </div>

              <div className="space-y-1 border-t pt-4">
                <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Account
                </p>
                {accountLinks.map(renderMenuItem)}
              </div>
            </nav>

            <div className="border-t p-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
                className="h-12 w-full justify-start gap-3 rounded-xl px-4 text-[15px] text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}

                <span>
                  {isLoggingOut
                    ? "Logging out..."
                    : "Log out"}
                </span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <>
      {isLoggingOut && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-9 w-9 animate-spin text-primary" />

            <div>
              <p className="font-semibold">Signing you out</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Redirecting to the login page…
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bb-app-header sticky top-0 z-50 w-full">
        <header className="rounded-b-[26px] bg-[#10241c] text-white shadow-[0_12px_32px_rgba(0,0,0,0.24)]">
          <div className="mx-auto flex h-[70px] w-full max-w-7xl items-center justify-between px-3.5 sm:px-5 lg:px-6">
            <div className="flex min-w-0 items-center gap-0">
              {renderNavigationMenu()}

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="-ml-0.5 min-w-0 rounded-lg px-0.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#10241c]"
                aria-label="Go to dashboard"
              >
                <BachelorBiteWordmark />
              </button>
            </div>

            <div className="ml-3 flex shrink-0 items-center">
              {renderUserSection()}
            </div>
          </div>
        </header>

        {shouldShowBackRow && (
          <div className="mx-auto w-full max-w-7xl px-3 pt-2 sm:px-5 lg:px-6">
            <BackButton className="h-9 rounded-xl px-2.5 text-[13px] font-medium" />
          </div>
        )}

        {shouldShowShoppingAlert && (
          <div className="mx-auto w-full max-w-7xl px-3 pt-2 sm:px-5 lg:px-6">
            <button
              type="button"
              onClick={() => router.push("/shopping-list")}
              disabled={isLoggingOut}
              className={cn(
                "group flex w-full items-center gap-3 rounded-2xl border border-black/[0.07] bg-[#fbfbf7] px-3.5 py-2.5 text-left text-[#17241e]",
                "shadow-[0_10px_28px_rgba(0,0,0,0.16)] transition-transform hover:-translate-y-0.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                "animate-in fade-in slide-in-from-top-2 duration-500 motion-reduce:animate-none"
              )}
              aria-label={`Open shopping list. ${shoppingItemCount} active items`}
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                <span
                  className={cn(
                    "absolute inset-0 rounded-full",
                    urgentShoppingItemCount > 0
                      ? "animate-ping bg-[#ef6f51]/18"
                      : "bg-[#74d8c8]/14"
                  )}
                  aria-hidden="true"
                />

                <span
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-full border",
                    urgentShoppingItemCount > 0
                      ? "border-[#ef6f51]/25 bg-[#fff0ea] text-[#d95f43]"
                      : "border-[#4ebca9]/20 bg-[#e9f8f4] text-[#247d6d]"
                  )}
                >
                  {urgentShoppingItemCount > 0 ? (
                    <BellRing className="h-[18px] w-[18px]" />
                  ) : (
                    <ShoppingBasket className="h-[18px] w-[18px]" />
                  )}
                </span>
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[12px] font-semibold leading-5">
                    Shopping needed
                  </span>

                  <span className="rounded-full bg-[#e9f8f4] px-2 py-0.5 text-[10px] font-medium text-[#247d6d]">
                    {shoppingItemCount} {shoppingItemCount === 1 ? "item" : "items"}
                  </span>

                  {urgentShoppingItemCount > 0 && (
                    <span className="rounded-full bg-[#fff0ea] px-2 py-0.5 text-[10px] font-medium text-[#c64f37]">
                      {urgentShoppingItemCount} urgent
                    </span>
                  )}
                </span>

                <span className="mt-0.5 block truncate text-[10.5px] leading-4 text-[#66736d]">
                  Urgent items are waiting in the group list
                </span>
              </span>

              <ChevronRight className="h-4 w-4 shrink-0 text-[#7b8781] transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
