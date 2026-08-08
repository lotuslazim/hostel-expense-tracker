"use client";

import {
    useEffect,
    type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import AppDock from "@/components/app/AppDock";
import { ReminderListener } from "@/components/app/ReminderListener";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { InventoryProvider } from "@/contexts/InventoryContext";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { I18nProvider } from "@/i18n/client-provider";

const APP_SURFACE_CLASS = "bb-app-surface";

const APP_ROUTE_PREFIXES = [
    "/dashboard",
    "/report",
    "/chat",
    "/admin",
    "/admin-profile",
    "/inventory",
    "/notice-board",
    "/profile",
    "/settings",
    "/settlements",
    "/shopping-list",
];

function isAuthenticatedAppRoute(pathname: string) {
    return APP_ROUTE_PREFIXES.some((routePrefix) => {
        return (
            pathname === routePrefix ||
            pathname.startsWith(`${routePrefix}/`)
        );
    });
}

export function ClientProviders({
    children,
}: {
    children: ReactNode;
}) {
    const pathname = usePathname();

    useEffect(() => {
        const shouldUseAppSurface =
            isAuthenticatedAppRoute(pathname);

        document.body.classList.toggle(
            APP_SURFACE_CLASS,
            shouldUseAppSurface
        );

        return () => {
            document.body.classList.remove(APP_SURFACE_CLASS);
        };
    }, [pathname]);

    return (
        <FirebaseClientProvider>
            <I18nProvider>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    forcedTheme="dark"
                    enableSystem={false}
                    disableTransitionOnChange
                >
                    <InventoryProvider>
                        {children}
                        <Toaster />
                        <ReminderListener />
                        <AppDock />
                        <OnboardingGate />
                    </InventoryProvider>
                </ThemeProvider>
            </I18nProvider>
        </FirebaseClientProvider>
    );
}
