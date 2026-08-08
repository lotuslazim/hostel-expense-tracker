"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";
import Link from "next/link";

import { LandingHeader } from "@/components/app/landing-header";
import DotGrid from "@/components/DotGrid";
import { Logo } from "@/components/icons/logo";
import { MobileLandingPage } from "@/components/landing/MobileLandingPage";
import { MobilePreviewCard } from "@/components/landing/MobilePreviewCard";
import DriftWallSplash from "@/components/splash/DriftWallSplash";
import { useIsMobile } from "@/hooks/use-mobile";

export default function LandingPage() {
    const isMobile = useIsMobile();

    const [showSplash, setShowSplash] =
        useState(true);

    const handleSplashComplete =
        useCallback(() => {
            setShowSplash(false);
        }, []);

    useEffect(() => {
        const shouldLockScroll =
            Boolean(isMobile) || showSplash;

        document.documentElement.classList.toggle(
            "no-scroll",
            shouldLockScroll
        );

        document.body.classList.toggle(
            "no-scroll",
            shouldLockScroll
        );

        return () => {
            document.documentElement.classList.remove(
                "no-scroll"
            );

            document.body.classList.remove(
                "no-scroll"
            );
        };
    }, [isMobile, showSplash]);

    if (showSplash) {
        return (
            <DriftWallSplash
                minimumDuration={8400}
                onComplete={handleSplashComplete}
            />
        );
    }

    return (
        <main>
            {/* =====================================================
          DESKTOP LANDING PAGE
          ===================================================== */}
            <div className="hidden min-h-screen md:block yellow-gradient-bg">
                <div className="landing-page-container relative text-slate-800">
                    <div className="absolute inset-0 z-0">
                        <DotGrid
                            dotSize={2}
                            gap={25}
                            baseColor="rgba(255,255,255,0.1)"
                            activeColor="rgba(255,255,255,0.3)"
                            proximity={100}
                            shockRadius={200}
                            shockStrength={2}
                            resistance={500}
                            returnDuration={1}
                        />
                    </div>

                    <header className="absolute inset-x-0 top-0 z-20 grid grid-cols-3 items-center p-8">
                        <div className="justify-self-start">
                            <Logo
                                textColor="text-slate-800"
                                secondaryColor="text-secondary"
                            />
                        </div>

                        <div className="justify-self-center">
                            <LandingHeader />
                        </div>
                    </header>

                    <section className="landing-left-section z-10 flex">
                        <div className="flex flex-grow items-center">
                            <div className="text-content">
                                <p className="text-2xl font-medium text-slate-800">
                                    No notes, no Excel—just one tap,
                                    done.
                                </p>

                                <h1
                                    className="my-4 text-[6.5rem] font-extrabold leading-none tracking-tighter"
                                    style={{
                                        userSelect: "none",
                                    }}
                                >
                                    <span className="text-slate-800">
                                        Bachelor
                                    </span>

                                    <span className="text-secondary">
                                        Bite.
                                    </span>
                                </h1>

                                <p className="text-xl font-medium text-slate-600">
                                    Here to make your bachelor life
                                    easier —
                                    <br />
                                    because someone has to.
                                </p>

                                <div className="mt-8 flex gap-4">
                                    <Link
                                        href="/login?mode=signup"
                                        className="flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-3 font-semibold text-white shadow-md transition-all hover:opacity-90"
                                    >
                                        SIGN UP
                                    </Link>

                                    <Link
                                        href="/login?mode=login"
                                        className="flex items-center gap-2 rounded-xl border border-slate-800 px-6 py-3 font-semibold text-slate-800 shadow-md transition-all hover:bg-white/10"
                                    >
                                        <span aria-hidden="true">
                                            ▶
                                        </span>

                                        LOG IN
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="flex-grow-0" />
                    </section>

                    <section className="landing-right-section z-10 flex">
                        <MobilePreviewCard />
                    </section>
                </div>
            </div>

            {/* =====================================================
          MOBILE APP LANDING PAGE

          MobileLandingPage mount হওয়ার সঙ্গে সঙ্গে:
          1. Mascot/scenery নিচ থেকে আসবে
          2. Green card পরে উঠে আসবে
          ===================================================== */}
            <div className="block min-h-[100dvh] w-full overflow-hidden bg-[#FFF8EA] md:hidden">
                <MobileLandingPage />
            </div>
        </main>
    );
}