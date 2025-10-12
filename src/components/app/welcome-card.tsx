
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function WelcomeCard() {
    const router = useRouter();

    const goToAdmin = () => {
        router.push('/admin');
    }

    return (
        <Card className="max-w-2xl mx-auto mt-8 text-center shadow-lg">
            <CardHeader>
                <CardTitle className="text-3xl font-headline">Welcome to BachelorBite!</CardTitle>
                <CardDescription className="text-md pt-2">
                    It looks like you&apos;re not part of a group yet.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="py-6">
                    <h2 className="text-xl font-semibold mb-2">Let&apos;s Get You Set Up</h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Create a new group to start tracking meals and expenses, or join an existing one if you have an invitation code.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button onClick={goToAdmin} size="lg">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Create or Join a Group
                        </Button>
                    </div>
                </div>
                 <div className="text-sm text-muted-foreground mt-4">
                    You can manage your group from the <Link href="/admin" className="underline hover:text-primary">Group Details page</Link> at any time.
                </div>
            </CardContent>
        </Card>
    );
}
