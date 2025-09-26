"use client";

import * as React from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MonthSwitcherProps extends React.HTMLAttributes<HTMLDivElement> {
  currentDate: Date;
  onMonthChange: (direction: "next" | "prev") => void;
}

export function MonthSwitcher({
  className,
  currentDate,
  onMonthChange,
}: MonthSwitcherProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onMonthChange("prev")}
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div
        className="flex h-10 w-[240px] items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
      >
        <span>{format(currentDate, "MMMM yyyy")}</span>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onMonthChange("next")}
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
