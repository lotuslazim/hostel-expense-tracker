"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { usePathname } from "next/navigation";

import { firestore } from "@/firebase/config";
import { useDoc, useUser } from "@/firebase";
import {
  OnboardingExperience,
  OnboardingLoadingScreen,
} from "./OnboardingExperience";

const CURRENT_ONBOARDING_VERSION = 1;

const AUTHENTICATED_APP_ROUTES = [
  "/dashboard",
  "/report",
  "/chat",
  "/admin",
  "/admin-profile",
  "/inventory",
  "/notice-board",
  "/profile",
  "/settings",
  "/settlements",
  "/shopping-list",
];

type UserOnboardingData = {
  onboardingCompletedAt?: unknown;
  onboardingVersion?: number;
};

function isAuthenticatedAppRoute(pathname: string) {
  return AUTHENTICATED_APP_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function OnboardingGate() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const [dismissedUserId, setDismissedUserId] = useState<string | null>(null);

  const userRef = useMemo(
    () => (user ? doc(firestore, "users", user.uid) : null),
    [user]
  );

  const {
    data: userData,
    isLoading: isUserDataLoading,
    error: userDataError,
  } = useDoc<UserOnboardingData>(userRef);

  useEffect(() => {
    if (!user || dismissedUserId === user.uid) {
      return;
    }

    setDismissedUserId(null);
  }, [dismissedUserId, user]);

  if (!isAuthenticatedAppRoute(pathname) || !user) {
    return null;
  }

  if (
    isUserLoading ||
    isUserDataLoading ||
    (!userData && !userDataError)
  ) {
    return <OnboardingLoadingScreen />;
  }

  if (!userData) {
    return null;
  }

  const hasCompletedOnboarding =
    Boolean(userData.onboardingCompletedAt) ||
    (userData.onboardingVersion ?? 0) >= CURRENT_ONBOARDING_VERSION;

  if (hasCompletedOnboarding || dismissedUserId === user.uid) {
    return null;
  }

  const completeOnboarding = async () => {
    await setDoc(
      doc(firestore, "users", user.uid),
      {
        onboardingCompletedAt: serverTimestamp(),
        onboardingVersion: CURRENT_ONBOARDING_VERSION,
      },
      { merge: true }
    );

    setDismissedUserId(user.uid);
  };

  return (
    <OnboardingExperience
      onComplete={completeOnboarding}
      onSkip={completeOnboarding}
    />
  );
}
