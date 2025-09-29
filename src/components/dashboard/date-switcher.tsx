
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDays, subDays } from "date-fns";

interface DateSwitcherProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateSwitcher({ currentDate, onDateChange }: DateSwitcherProps) {
  const handleDayChange = (direction: "prev" | "next") => {
    const newDate = direction === "prev" ? subDays(currentDate, 1) : addDays(currentDate, 1);
    onDateChange(newDate);
  };
  
  return (
    <div className="flex items-center gap-2 pt-2">
       <Button variant="outline" size="icon" onClick={() => handleDayChange("prev")} aria-label="Previous day">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !currentDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {currentDate ? format(currentDate, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={(date) => date && onDateChange(date)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Button variant="outline" size="icon" onClick={() => handleDayChange("next")} aria-label="Next day">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
