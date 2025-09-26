
"use client";

import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthSwitcherProps {
  currentDate: Date;
  onMonthChange: (direction: "next" | "prev") => void;
}

export function MonthSwitcher({ currentDate, onMonthChange }: MonthSwitcherProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onMonthChange("prev")}
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="w-36 text-center text-lg font-semibold">
        {format(currentDate, "MMMM yyyy")}
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
