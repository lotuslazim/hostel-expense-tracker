"use client";

import { MonthlySummary } from "@/components/report/monthly-summary";
import { useState } from "react";
import { startOfMonth, format, addMonths, subMonths } from "date-fns";
import { MonthSwitcher } from "@/components/report/month-switcher";

export default function ReportPage() {
  const [currentDate, setCurrentDate] = useState(startOfMonth(new Date()));

  const handleMonthChange = (direction: "next" | "prev") => {
    if (direction === "next") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Monthly Summary for {format(currentDate, "MMMM yyyy")}
          </h1>
        </div>
        <MonthSwitcher
          currentDate={currentDate}
          onMonthChange={handleMonthChange}
        />
      </div>
      <MonthlySummary month={currentDate} />
    </div>
  );