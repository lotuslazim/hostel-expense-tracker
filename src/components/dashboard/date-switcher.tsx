
"use client";

import * as React from "react";
import { format, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DateSwitcherProps extends React.HTMLAttributes<HTMLDivElement> {
  currentDate: Date;
  onDateChange: (direction: "next" | "prev") => void;
}

export function DateSwitcher({
  className,
  currentDate,
  onDateChange,
}: DateSwitcherProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onDateChange("prev")}
        aria-label="Previous day"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div
        className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background font-medium"
      >
        <span>{isToday(currentDate) ? "Today" : format(currentDate, "MMM d, yyyy")}</span>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onDateChange("next")}
        aria-label="Next day"
        disabled={isToday(currentDate)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
