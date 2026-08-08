"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

import { SignupForm } from "@/components/auth/signup-form";

function SignupPageContent() {
  const searchParams = useSearchParams();

  const cameFromOnboarding =
    searchParams.get("transition") === "onboarding";

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#061E17]">
      <motion.section
        className="min-h-[100dvh] overflow-y-auto bg-background"
        initial={
          cameFromOnboarding
            ? {
              y: "100%",
              borderTopLeftRadius: 44,
              borderTopRightRadius: 44,
            }
            : {
              y: 0,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
            }
        }
        animate={{
          y: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        }}
        transition={{
          duration: cameFromOnboarding ? 1.1 : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div className="flex min-h-[100dvh] items-center justify-center p-4">
          <SignupForm />
        </div>
      </motion.section>
    </main>
  );
}

function SignupPageFallback() {
  return (
    <main className="min-h-[100dvh] bg-[#061E17]" />
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageFallback />}>
      <SignupPageContent />
    </Suspense>
  );
}