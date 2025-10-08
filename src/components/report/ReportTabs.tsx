"use client";

import { NavLink } from "@/components/app/nav-link";

export function ReportTabs() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        <NavLink href="/report">
            <button className="px-4 py-2 data-[active=true]:border-b-2 data-[active=true]:border-primary data-[active=true]:text-primary">Monthly Summary</button>
        </NavLink>
        <NavLink href="/report/meals">
            <button className="px-4 py-2 data-[active=true]:border-b-2 data-[active=true]:border-primary data-[active=true]:text-primary">Meals</button>
        </NavLink>
      </div>
    </div>
  );
}
