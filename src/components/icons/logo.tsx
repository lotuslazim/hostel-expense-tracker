
import Link from "next/link";
import { Utensils } from "lucide-react";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2"
      aria-label="Meal Calculator Home"
    >
      <div className="p-2 bg-primary rounded-lg">
        <Utensils className="h-6 w-6 text-primary-foreground" />
      </div>
      <span className="text-2xl font-bold font-headline">Meal Calculator</span>
    </Link>
  );
}
