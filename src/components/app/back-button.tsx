"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonProps = {
    className?: string;
};

export function BackButton({
    className,
}: BackButtonProps) {
    const router = useRouter();

    const handleBack = () => {
        /*
         * কোনো fixed page নয়।
         * Browser history অনুযায়ী ঠিক আগের visited page-এ যাবে।
         *
         * Page 4 → Page 3 → Page 2 → Page 1
         */
        router.back();
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className={cn(
                "w-fit gap-2 text-muted-foreground hover:text-foreground",
                className
            )}
            aria-label="Go to previous page"
        >
            <ArrowLeft className="h-4 w-4" />

            <span>Back</span>
        </Button>
    );
}