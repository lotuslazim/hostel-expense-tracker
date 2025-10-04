

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function ReportNavLink({ href, children }: { href: string, children: React.ReactNode }) {
    const pathname = usePathname();
    const isActive = pathname.startsWith(href) && (href !== '/report' || pathname === '/report');


    return (
        <Link href={href} className="w-full">
            <TabsTrigger value={href} className="w-full" disabled={isActive}>
                {children}
            </TabsTrigger>
        </Link>
    );
}

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  
  const getActiveTab = () => {
    if (pathname.startsWith('/report/meals')) return '/report/meals';
    return '/report';
  }

  return (
    <div className="space-y-6">
        <Tabs value={getActiveTab()} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <ReportNavLink href="/report">Overall</ReportNavLink>
                <ReportNavLink href="/report/meals">Meals</ReportNavLink>
            </TabsList>
        </Tabs>
        {children}
    </div>
  )
}
