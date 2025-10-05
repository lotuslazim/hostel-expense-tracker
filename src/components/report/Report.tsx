"use client";

import { MonthlySummary } from "./monthly-summary";
import { useState } from "react";
import { startOfMonth } from "date-fns";

export function Report() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  
  return (
    <div className="space-y-6">
      <MonthlySummary month={currentMonth} />
    </div>
  );
}
