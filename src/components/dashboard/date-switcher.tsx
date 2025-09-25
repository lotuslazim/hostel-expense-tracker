"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, subDays } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DateSwitcher({
  className,
  currentDate,
}: React.HTMLAttributes<HTMLDivElement> & { currentDate: Date }) {
  const router = useRouter();

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      router.push(`/dashboard?date=${format(date, "yyyy-MM-dd")}`);
    }
  };

  const handlePreviousDay = () => {
    handleDateChange(subDays(currentDate, 1));
  };

  const handleNextDay = () => {
    handleDateChange(addDays(currentDate, 1));
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button variant="outline" size="icon" onClick={handlePreviousDay} aria-label="Previous day">
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
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={handleDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Button variant="outline" size="icon" onClick={handleNextDay} aria-label="Next day">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
