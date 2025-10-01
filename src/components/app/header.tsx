
import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { UserNav } from "@/components/app/user-nav";
import { NavLink } from "./nav-link";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, MessageSquare } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-auto flex">
           <Logo />
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="ghost" size="icon" asChild>
              <Link href="/chat">
                <MessageSquare />
                <span className="sr-only">Open Chat</span>
              </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild><Link href="/dashboard">Dashboard</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/report">Monthly Report</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/inventory">Inventory</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/admin">Admin</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <UserNav />
        </div>
      </div>
    </header>
  );
}
