"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";

import { ProgressBar } from "@/components/app/progress-bar";

export function ConditionalProgressBar() {
    const pathname = usePathname();

    const shouldHideProgressBar =
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/signup";

    useEffect(() => {
        if (shouldHideProgressBar) {
            NProgress.done(true);
        }
    }, [shouldHideProgressBar, pathname]);

    if (shouldHideProgressBar) {
        return null;
    }

    return <ProgressBar />;
}