"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function ReportNavLink({ href, children }: { href: string, children: React.ReactNode }) {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link 
            href={href} 
            className={cn(
                "px-4 py-2 text-muted-foreground transition-colors",
                "hover:text-primary",
                isActive && "border-b-2 border-primary text-primary"
            )}
        >
            {children}
        </Link>
    )
}

export function ReportTabs() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        <ReportNavLink href="/report">
            Monthly Summary
        </ReportNavLink>
        <ReportNavLink href="/report/meals">
            Meals
        </ReportNavLink>
        <ReportNavLink href="/report/expenses">
            Expenses
        </ReportNavLink>
      </div>
    </div>
  );
}
