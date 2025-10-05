
"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useUser, useDoc, useFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogOut, User, Settings, Users, Shield } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export function UserNav() {
  const { user, isUserLoading } = useUser();
  const { auth, firestore } = useFirebase();
  const router = useRouter();

  const userDocRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  
  const isLoading = isUserLoading || (user && isUserDataLoading);

  if (isLoading) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  if (!user) {
    return null; // or show a login button
  }
  
  const isUserAdmin = userData?.isAdmin ?? false;

  const userName = userData?.displayName || user.displayName || user.email?.split("@")[0] || "User";
  const userEmail = user.email || "user@example.com";
  const avatarFallback = userName.charAt(0).toUpperCase();
  const photoURL = userData?.photoURL || user.photoURL;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            {photoURL ? <AvatarImage src={photoURL} alt="User avatar" /> : <AvatarFallback>{avatarFallback}</AvatarFallback>}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />Profile
            </Link>
          </DropdownMenuItem>
           <DropdownMenuItem asChild>
              <Link href="/admin">
                <Users className="mr-2 h-4 w-4" />Group Details
              </Link>
            </DropdownMenuItem>
          {isUserAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/admin-profile">
                <Shield className="mr-2 h-4 w-4" />Admin Profile
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
