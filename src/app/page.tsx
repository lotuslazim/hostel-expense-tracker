
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { ArrowRight } from "lucide-react";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <p className="text-xl text-muted-foreground">Loading...</p>
            </div>
        </div>
    )
  }

  // If loading is finished and there's a user, this part won't be rendered
  // because the useEffect will have already initiated the redirect.
  // We show the welcome page only if loading is done AND there's no user.
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-2xl mx-auto px-4">
          <div className="flex justify-center">
              <Logo isStacked={true} />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold font-headline text-foreground">
              BachelorBite won’t cook for you, but it’ll make your messy life easier.
            </h1>
            <p className="text-xl text-muted-foreground">
              Your journey to simplified meal and expense tracking starts here.
            </p>
          </div>
          
          <div className="space-y-4 pt-4">
            <Button asChild size="lg">
              <Link href="/login">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // This will be shown briefly for authenticated users before redirecting.
  // Or, it can be a skeleton loader.
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
          <p className="text-xl text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
