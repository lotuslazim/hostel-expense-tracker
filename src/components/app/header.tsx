
import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { UserNav } from "@/components/app/user-nav";
import { NavLink } from "./nav-link";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-8 flex">
           <Logo />
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/report">Monthly Report</NavLink>
            <NavLink href="/profile">Profile</NavLink>
            <NavLink href="/admin">Admin</NavLink>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
