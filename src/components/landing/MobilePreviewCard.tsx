"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

/**
 * Galaxy A55-style phone mockup (19.5:9) showing the mobile landing screenshot.
 * Screenshot lives at /public/mobile-preview.jpeg
 */
export function MobilePreviewCard() {
    return (
        <div className="phone-stage">
            <div className="phone">
                {/* side buttons */}
                <span className="btn btn-vol" />
                <span className="btn btn-power" />

                <div className="screen">
                    <Image
                        src="/mobile-preview.jpeg"
                        alt="BachelorBite mobile app preview"
                        fill
                        sizes="290px"
                        priority
                        className="object-cover"
                    />

                    {/* clickable areas over the screenshot's buttons */}
                    <Link
                        href="/login?mode=signup"
                        aria-label="Create Account"
                        className="hotspot"
                        style={{ top: "84.4%", height: "6.4%" }}
                    />
                    <Link
                        href="/login?mode=login"
                        aria-label="Log In"
                        className="hotspot"
                        style={{ top: "92.4%", height: "5.9%" }}
                    />

                    <span className="punch-hole" />
                    <span className="glare" />
                </div>
            </div>
            <div className="floor-shadow" />

            <style jsx>{`
                .phone-stage {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    perspective: 1400px;
                    padding: 24px 0 8px;
                }

                .phone {
                    --w: 300px;
                    position: relative;
                    width: var(--w);
                    aspect-ratio: 1162 / 2576;
                    padding: 9px;
                    border-radius: 42px;
                    background: linear-gradient(
                        115deg,
                        #4b4f57 0%,
                        #1c1e22 18%,
                        #2e3137 50%,
                        #15171a 82%,
                        #5a5f68 100%
                    );
                    box-shadow:
                        inset 0 0 0 1.5px rgba(255, 255, 255, 0.18),
                        inset 0 0 6px rgba(0, 0, 0, 0.6),
                        0 30px 60px -15px rgba(30, 41, 59, 0.45),
                        0 12px 24px -8px rgba(30, 41, 59, 0.3);
                    transform: rotateY(-14deg) rotateX(4deg) rotateZ(1deg);
                    transform-style: preserve-3d;
                    transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
                }

                .phone:hover {
                    transform: rotateY(0deg) rotateX(0deg) rotateZ(0deg)
                        translateY(-6px);
                }

                .screen {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 34px;
                    overflow: hidden;
                    background: #0e2a1f;
                    box-shadow: 0 0 0 2px #000;
                }

                .punch-hole {
                    position: absolute;
                    top: 12px;
                    left: 50%;
                    width: 11px;
                    height: 11px;
                    transform: translateX(-50%);
                    border-radius: 50%;
                    background: radial-gradient(
                        circle at 35% 35%,
                        #3a3f4a 0%,
                        #0a0a0c 60%
                    );
                    box-shadow: 0 0 0 1.5px rgba(0, 0, 0, 0.7);
                    z-index: 3;
                    pointer-events: none;
                }

                /* curved-glass highlight */
                .glare {
                    position: absolute;
                    inset: 0;
                    z-index: 2;
                    pointer-events: none;
                    background:
                        linear-gradient(
                            115deg,
                            rgba(255, 255, 255, 0.28) 0%,
                            rgba(255, 255, 255, 0.06) 22%,
                            transparent 40%
                        ),
                        linear-gradient(
                            90deg,
                            rgba(0, 0, 0, 0.12) 0%,
                            transparent 6%,
                            transparent 94%,
                            rgba(0, 0, 0, 0.12) 100%
                        );
                }

                .hotspot {
                    position: absolute;
                    left: 4.5%;
                    width: 91%;
                    border-radius: 999px;
                    z-index: 4;
                    transition: background 0.2s;
                }

                .hotspot:hover {
                    background: rgba(255, 255, 255, 0.08);
                }

                .btn {
                    position: absolute;
                    right: -3px;
                    width: 3px;
                    border-radius: 0 3px 3px 0;
                    background: linear-gradient(90deg, #2a2d33, #5a5f68);
                }

                .btn-vol {
                    top: 110px;
                    height: 64px;
                }

                .btn-power {
                    top: 190px;
                    height: 38px;
                }

                .floor-shadow {
                    width: 240px;
                    height: 22px;
                    margin-top: 18px;
                    border-radius: 50%;
                    background: radial-gradient(
                        ellipse at center,
                        rgba(30, 41, 59, 0.35) 0%,
                        transparent 70%
                    );
                    filter: blur(4px);
                }

                @media (prefers-reduced-motion: reduce) {
                    .phone,
                    .phone:hover {
                        transition: none;
                        transform: none;
                    }
                }
            `}</style>
        </div>
    );
}
