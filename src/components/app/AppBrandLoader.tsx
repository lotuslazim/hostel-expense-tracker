"use client";

import { useEffect } from "react";

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
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {/* The SVG contains its own animation, so no spinner or ring is needed. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/crocodile-loader.svg"
        alt=""
        aria-hidden="true"
        className={cn(
          "h-auto max-h-[70dvh] max-w-[82vw] select-none object-contain",
          compact ? "w-[min(64vw,260px)]" : "w-[min(72vw,320px)]",
        )}
        draggable={false}
      />
    </div>
  );
}
