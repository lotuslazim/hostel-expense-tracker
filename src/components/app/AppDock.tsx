"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
import { Scale } from "lucide-react";
import {
  VscCalendar,
  VscComment,
  VscGraph,
  VscPackage,
} from "react-icons/vsc";

import Dock from "./Dock";
import { Badge } from "@/components/ui/badge";
import { firestore } from "@/firebase/config";
import { useDoc, useUser } from "@/firebase";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AppDock() {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const { user, isUserLoading } = useUser();

  const userDocRef = useMemo(() => {
    if (!user) {
      return null;
    }

    return doc(firestore, "users", user.uid);
  }, [user]);

  const {
    data: userData,
    isLoading: isUserDataLoading,
  } = useDoc(userDocRef);

  const groupId = userData?.groupId;

  const { unreadCount } = useUnreadMessages(
    groupId,
    user?.uid
  );

  const hiddenRoutes = [
    "/",
    "/login",
    "/signup",
    "/about",
    "/contact",
  ];

  const shouldHideDock =
    isUserLoading ||
    isUserDataLoading ||
    !user ||
    hiddenRoutes.includes(pathname) ||
    pathname.startsWith("/chat");

  if (shouldHideDock) {
    return null;
  }

  const items = [
    {
      href: "/dashboard",
      icon: <VscGraph size={28} />,
      label: "Dashboard",
      onClick: () => router.push("/dashboard"),
    },
    {
      href: "/report",
      icon: <VscCalendar size={28} />,
      label: "Report",
      onClick: () => router.push("/report"),
    },
    {
      href: "/inventory",
      icon: <VscPackage size={28} />,
      label: "Inventory",
      onClick: () => router.push("/inventory"),
    },
    {
      href: "/settlements",
      icon: <Scale size={28} />,
      label: "Settlements",
      onClick: () => router.push("/settlements"),
    },
    {
      href: "/chat",
      icon: (
        <div className="relative">
          <VscComment size={28} />

          {unreadCount > 0 && (
            <Badge className="absolute -right-2 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive p-0 text-xs text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </div>
      ),
      label: "Chat",
      onClick: () => router.push("/chat"),
    },
  ];

  const activeItem = items.find((item) =>
    pathname.startsWith(item.href)
  );

  return (
    <>
      {/*
        এই spacer page-এর নিচে Dock-এর জন্য স্থায়ী জায়গা রাখে।
        তাই শেষ button বা content Dock-এর নিচে ঢাকা পড়বে না।
      */}
      <div
        aria-hidden="true"
        className="h-[calc(6.75rem+env(safe-area-inset-bottom))] md:h-24"
      />

      <nav
        aria-label="Primary application navigation"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      >
        <div className="pointer-events-auto max-w-full">
          <Dock
            items={items}
            magnification={isMobile ? 0 : 24}
            className="yellow-gradient-bg max-w-[calc(100vw-1.5rem)] text-primary-foreground shadow-xl"
            activeHref={activeItem?.href}
          />
        </div>
      </nav>
    </>
  );
}