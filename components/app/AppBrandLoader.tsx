"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type AppBrandLoaderProps = {
  label?: string;
  compact?: boolean;
  className?: string;
};

export function AppBrandLoader({
  label = "Loading BachelorBite",
  compact = false,
  className,
}: AppBrandLoaderProps) {
  useEffect(() => {
    document.body.classList.add("bb-brand-loader-active");

    return () => {
      document.body.classList.remove("bb-brand-loader-active");
    };
  }, []);

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-[#07150f]",
        compact
          ? "min-h-[52vh] w-full"
          : "fixed inset-0 z-[200] min-h-[100dvh] w-screen",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative flex h-[138px] w-[138px] items-center justify-center">
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-transparent border-l-white/95 border-t-white/95"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.9,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        <motion.span
          aria-hidden="true"
          className="absolute inset-[10px] rounded-full border border-transparent border-b-white/75 border-r-white/75"
          animate={{ rotate: -360 }}
          transition={{
            duration: 2.45,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        <div className="relative flex h-[92px] w-[92px] items-center justify-center rounded-full border-[3px] border-[#f4d35e] bg-[#10291f]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/crocodile_float_icon.png"
            alt=""
            className="h-[72px] w-[72px] select-none object-contain"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
