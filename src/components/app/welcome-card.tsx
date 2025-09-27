
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function WelcomeCard() {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Welcome to NourishTrack!</CardTitle>
                <CardDescription>It looks like you're not part of a group yet.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8">
                    <h2 className="text-xl font-semibold mb-2">Get Started</h2>
                    <p className="text-muted-foreground mb-6">Create a new group to manage your flat's meals and expenses, or join an existing one if you have an invitation code.</p>
                    <Button asChild>
                        <Link href="/admin">
                            Go to the Admin Panel <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
