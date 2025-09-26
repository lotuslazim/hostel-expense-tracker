
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, addDays, subDays } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

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
  currentDate: initialDate,
}: React.HTMLAttributes<HTMLDivElement> & { currentDate: Date }) {
  const router = useRouter();
  const [date, setDate] = React.useState<Date>(initialDate);

  React.useEffect(() => {
    setDate(initialDate);
  }, [initialDate]);


  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      router.push(`/dashboard?date=${format(newDate, "yyyy-MM-dd")}`);
    }
  };

  const handlePreviousDay = () => {
    handleDateChange(subDays(date, 1));
  };

  const handleNextDay = () => {
    handleDateChange(addDays(date, 1));
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
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={date}
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
