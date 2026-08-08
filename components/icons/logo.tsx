"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

interface LogoProps {
  isStacked?: boolean;
  isMascotAnimated?: boolean;
  mascotSize?: "default" | "large";
  className?: string;
  textSize?: "default" | "large";
  textColor?: string;
  secondaryColor?: string;
  compact?: boolean;
}

export function Logo({
  isStacked = false,
  isMascotAnimated = false,
  mascotSize = "default",
  textSize = "default",
  textColor = "text-foreground",
  secondaryColor = "text-primary",
  compact = false,
  className,
}: LogoProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-0",
        isStacked && "flex-col",
        className
      )}
      aria-label="BachelorBite Home"
    >
      <div
        className={cn(
          "relative shrink-0 transition-transform duration-300 group-hover:scale-105",
          compact && "-mr-0.5 h-8 w-[27px]",
          !compact &&
          mascotSize === "default" &&
          (isStacked
            ? "mb-2 h-12 w-20"
            : "h-9 w-9 md:h-10 md:w-10"),
          !compact &&
          mascotSize === "large" &&
          "h-24 w-24 md:h-28 md:w-28",
          isMascotAnimated && "animate-mascot-idle"
        )}
      >
        <Image
          src="/logo.png"
          alt="BachelorBite Logo"
          fill
          className="object-contain"
          sizes={
            compact
              ? "27px"
              : mascotSize === "large"
                ? "20vw"
                : "10vw"
          }
          priority
        />
      </div>

      <div
        className={cn(
          "font-bold tracking-[-0.035em]",
          compact ? "font-body text-[16px] leading-none" : "font-headline",
          isStacked && "text-center",
          !compact && textSize === "default" && "text-xl md:text-2xl",
          !compact && textSize === "large" && "text-5xl md:text-6xl"
        )}
      >
        <span className={cn(textColor)}>Bachelor</span>
        <span className={cn(secondaryColor)}>Bite</span>
      </div>
    </div>
  );
}
