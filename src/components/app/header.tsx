import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { UserNav } from "@/components/app/user-nav";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Logo />
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground/80 text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/report"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Monthly Report
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
