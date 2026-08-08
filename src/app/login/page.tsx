"use client";

import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

function LoginPageContent() {
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
          <LoginForm />
        </div>
      </motion.section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] bg-[#061E17]" />
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}