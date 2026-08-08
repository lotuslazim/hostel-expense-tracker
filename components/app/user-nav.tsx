"use client";

import { useMemo } from "react";
import { doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useDoc, useUser } from "@/firebase";
import { firestore } from "@/firebase/config";

export function UserNav() {
  const router = useRouter();
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

  const isLoading =
    isUserLoading || Boolean(user && isUserDataLoading);

  if (isLoading) {
    return (
      <Skeleton className="h-9 w-9 rounded-full bg-white/10 ring-2 ring-[#f6cf58]/35 ring-offset-2 ring-offset-[#10241c]" />
    );
  }

  if (!user) {
    return null;
  }

  const userName =
    userData?.displayName ||
    user.displayName ||
    user.email?.split("@")[0] ||
    "User";

  const photoURL =
    userData?.photoURL ||
    user.photoURL ||
    undefined;

  const avatarFallback =
    userName.trim().charAt(0).toUpperCase() || "U";

  return (
    <Button
      type="button"
      variant="ghost"
      className="relative h-11 w-11 rounded-full p-0 text-white hover:bg-white/[0.06]"
      aria-label="Open profile"
      onClick={() => router.push("/profile")}
    >
      <Avatar className="h-9 w-9 ring-2 ring-[#f6cf58] ring-offset-2 ring-offset-[#10241c]">
        <AvatarImage
          src={photoURL}
          alt={`${userName} profile`}
        />

        <AvatarFallback className="bg-[#23483c] text-[13px] font-semibold text-white">
          {avatarFallback}
        </AvatarFallback>
      </Avatar>
    </Button>
  );
}
