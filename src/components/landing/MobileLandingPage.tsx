"use client";

import Image from "next/image";
import {
    useCallback,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

type AuthMode = "login" | "signup";

export function MobileLandingPage() {
    const router = useRouter();

    const [transitionMode, setTransitionMode] =
        useState<AuthMode | null>(null);

    const openAuthPage = useCallback(
        (mode: AuthMode) => {
            if (transitionMode !== null) {
                return;
            }

            setTransitionMode(mode);

            const destination =
                mode === "signup"
                    ? "/signup?transition=onboarding"
                    : "/login?transition=onboarding";

            router.push(destination);
        },
        [router, transitionMode]
    );

    return (
        <main
            className={`${poppins.className} relative h-[100dvh] min-h-[640px] w-full overflow-hidden bg-[#FFF8EA] md:hidden`}
            style={{
                fontFamily: poppins.style.fontFamily,
            }}
        >
            {/* =====================================================
          TOP SECTION
          Mascot, road, buildings, clouds and sun
          ===================================================== */}
            <section className="bb-top-stage absolute inset-x-0 top-0 h-[69%] overflow-hidden">
                <div className="bb-scenery absolute inset-0">
                    {/* Warm background */}
                    <div
                        aria-hidden="true"
                        className="absolute inset-0"
                        style={{
                            background:
                                "radial-gradient(circle at 50% 34%, #FFFDF8 0%, #FFF8EA 54%, #F3E6C9 100%)",
                        }}
                    />

                    {/* Soft light behind mascot */}
                    <div
                        aria-hidden="true"
                        className="absolute left-1/2 top-[31%] h-72 w-72 -translate-x-1/2 rounded-full bg-[#FFD466]/10 blur-3xl"
                    />

                    {/* Sun */}
                    <div
                        aria-hidden="true"
                        className="absolute left-[17%] top-[4%] z-[1] h-[62px] w-[62px] rounded-full"
                        style={{
                            background:
                                "linear-gradient(145deg, #FFE7A0 0%, #FFC247 100%)",
                            boxShadow:
                                "0 12px 34px rgba(255, 194, 71, 0.2)",
                        }}
                    />

                    {/* Left cloud */}
                    <div
                        aria-hidden="true"
                        className="bb-cloud-left absolute left-[3%] top-[15%] z-[2] h-7 w-[104px] rounded-full bg-white/85 shadow-[0_12px_30px_rgba(108,84,43,0.08)]"
                    >
                        <span className="absolute -top-5 left-3 h-12 w-12 rounded-full bg-white/90" />
                        <span className="absolute -top-7 left-10 h-16 w-16 rounded-full bg-white/95" />
                        <span className="absolute -top-3 right-1 h-10 w-11 rounded-full bg-white/85" />
                    </div>

                    {/* Right cloud */}
                    <div
                        aria-hidden="true"
                        className="bb-cloud-right absolute right-[5%] top-[7%] h-8 w-[112px] rounded-full bg-white/85 shadow-[0_12px_30px_rgba(108,84,43,0.08)]"
                    >
                        <span className="absolute -top-6 left-3 h-14 w-14 rounded-full bg-white/90" />
                        <span className="absolute -top-8 left-11 h-[70px] w-[70px] rounded-full bg-white/95" />
                        <span className="absolute -top-4 right-1 h-12 w-12 rounded-full bg-white/85" />
                    </div>

                    {/* Small distant cloud */}
                    <div
                        aria-hidden="true"
                        className="absolute right-[22%] top-[27%] h-3.5 w-14 rounded-full bg-white/50"
                    >
                        <span className="absolute -top-2 left-3 h-5 w-6 rounded-full bg-white/55" />
                        <span className="absolute -top-3 left-6 h-7 w-8 rounded-full bg-white/55" />
                    </div>

                    {/* Background scenery */}
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 390 285"
                        preserveAspectRatio="none"
                        className="absolute inset-x-0 bottom-[20px] h-[52%] w-full"
                    >
                        <defs>
                            <linearGradient
                                id="bb-hill-gradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="#DDD1AE"
                                    stopOpacity="0.42"
                                />

                                <stop
                                    offset="100%"
                                    stopColor="#BFAE7E"
                                    stopOpacity="0.6"
                                />
                            </linearGradient>

                            <linearGradient
                                id="bb-road-gradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="#FFF5DA"
                                />

                                <stop
                                    offset="100%"
                                    stopColor="#EFD399"
                                />
                            </linearGradient>
                        </defs>

                        {/* Distant city */}
                        <g
                            fill="#BEAA7E"
                            opacity="0.27"
                        >
                            <rect
                                x="281"
                                y="41"
                                width="59"
                                height="173"
                                rx="8"
                            />

                            <rect
                                x="307"
                                y="16"
                                width="4"
                                height="32"
                                rx="2"
                            />

                            <rect
                                x="235"
                                y="98"
                                width="41"
                                height="117"
                                rx="7"
                            />

                            <rect
                                x="199"
                                y="128"
                                width="31"
                                height="87"
                                rx="6"
                            />

                            <rect
                                x="126"
                                y="109"
                                width="40"
                                height="106"
                                rx="6"
                            />
                        </g>

                        {/* Building windows */}
                        <g
                            fill="#FFF8EA"
                            opacity="0.55"
                        >
                            <rect
                                x="293"
                                y="71"
                                width="10"
                                height="13"
                                rx="2"
                            />

                            <rect
                                x="317"
                                y="71"
                                width="10"
                                height="13"
                                rx="2"
                            />

                            <rect
                                x="293"
                                y="98"
                                width="10"
                                height="13"
                                rx="2"
                            />

                            <rect
                                x="317"
                                y="98"
                                width="10"
                                height="13"
                                rx="2"
                            />

                            <rect
                                x="293"
                                y="125"
                                width="10"
                                height="13"
                                rx="2"
                            />

                            <rect
                                x="317"
                                y="125"
                                width="10"
                                height="13"
                                rx="2"
                            />

                            <rect
                                x="246"
                                y="120"
                                width="8"
                                height="10"
                                rx="2"
                            />

                            <rect
                                x="259"
                                y="120"
                                width="8"
                                height="10"
                                rx="2"
                            />
                        </g>

                        {/* Left house */}
                        <g
                            fill="#BCA777"
                            opacity="0.31"
                        >
                            <path d="M14 148L67 92L120 148V218H14V148Z" />

                            <path d="M4 150L67 82L130 150H114L67 101L20 150H4Z" />

                            <rect
                                x="29"
                                y="111"
                                width="8"
                                height="34"
                            />
                        </g>

                        {/* House windows */}
                        <g
                            fill="#FFF8EA"
                            opacity="0.58"
                        >
                            <rect
                                x="46"
                                y="158"
                                width="17"
                                height="19"
                                rx="1"
                            />

                            <rect
                                x="67"
                                y="158"
                                width="17"
                                height="19"
                                rx="1"
                            />

                            <rect
                                x="46"
                                y="181"
                                width="17"
                                height="19"
                                rx="1"
                            />

                            <rect
                                x="67"
                                y="181"
                                width="17"
                                height="19"
                                rx="1"
                            />
                        </g>

                        {/* Trees */}
                        <g opacity="0.48">
                            <rect
                                x="99"
                                y="179"
                                width="6"
                                height="48"
                                rx="3"
                                fill="#747A55"
                            />

                            <circle
                                cx="102"
                                cy="168"
                                r="27"
                                fill="#969A69"
                            />

                            <rect
                                x="330"
                                y="171"
                                width="6"
                                height="55"
                                rx="3"
                                fill="#747A55"
                            />

                            <circle
                                cx="333"
                                cy="155"
                                r="31"
                                fill="#969A69"
                            />
                        </g>

                        {/* Distant hills */}
                        <path
                            d="M0 220C46 190 93 211 135 196C180 179 218 207 261 190C307 172 350 190 390 207V285H0V220Z"
                            fill="url(#bb-hill-gradient)"
                        />

                        <path
                            d="M0 239C48 216 86 229 127 214C173 198 214 227 257 211C304 193 348 207 390 225V285H0V239Z"
                            fill="#D4C493"
                            opacity="0.62"
                        />

                        {/* Bushes */}
                        <g
                            fill="#909760"
                            opacity="0.58"
                        >
                            <circle
                                cx="14"
                                cy="239"
                                r="25"
                            />

                            <circle
                                cx="43"
                                cy="245"
                                r="32"
                            />

                            <circle
                                cx="75"
                                cy="248"
                                r="22"
                            />

                            <circle
                                cx="324"
                                cy="244"
                                r="28"
                            />

                            <circle
                                cx="356"
                                cy="235"
                                r="36"
                            />

                            <circle
                                cx="387"
                                cy="246"
                                r="26"
                            />
                        </g>

                        {/* Main road */}
                        <path
                            d="M164 194C181 185 210 185 227 194C250 209 284 245 330 285H60C108 245 142 209 164 194Z"
                            fill="url(#bb-road-gradient)"
                        />

                        {/* Foreground surface */}
                        <path
                            d="M0 252C68 233 116 253 166 239C219 225 273 242 390 248V285H0V252Z"
                            fill="#F6E4BB"
                            opacity="0.82"
                        />
                    </svg>
                </div>

                {/* Mascot stage */}
                <div className="absolute bottom-[30px] left-1/2 z-10 w-[clamp(188px,50vw,230px)] -translate-x-1/2">
                    <div className="bb-mascot relative">
                        {/* Wide ambient shadow */}
                        <div
                            aria-hidden="true"
                            className="absolute bottom-[14px] left-1/2 z-0 h-[18px] w-[60%] -translate-x-1/2 rounded-[50%] bg-[#2A2418]/35 blur-[6px]"
                        />

                        {/* Left foot contact shadow */}
                        <div
                            aria-hidden="true"
                            className="absolute bottom-[14px] left-[24%] z-[1] h-[8px] w-[25%] rounded-[50%] bg-black/35 blur-[3px]"
                        />

                        {/* Right foot contact shadow */}
                        <div
                            aria-hidden="true"
                            className="absolute bottom-[8px] right-[17%] z-[1] h-[9px] w-[28%] rounded-[50%] bg-black/38 blur-[3px]"
                        />

                        <Image
                            src="/mascot.png"
                            alt="BachelorBite crocodile mascot"
                            width={500}
                            height={500}
                            priority
                            sizes="(max-width: 768px) 50vw, 230px"
                            draggable={false}
                            className="relative z-10 h-auto w-full translate-y-[20px] select-none object-contain drop-shadow-[0_10px_15px_rgba(22,36,25,0.14)]"
                        />
                    </div>
                </div>
            </section>

            {/* =====================================================
          BOTTOM WELCOME CARD
          ===================================================== */}
            <section
                className="bb-welcome-card absolute inset-x-0 bottom-0 z-20 h-[34%] min-h-[286px] rounded-t-[38px] px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-5 shadow-[0_-18px_42px_rgba(5,28,20,0.2)]"
                style={{
                    background:
                        "linear-gradient(180deg, #08281E 0%, #061E17 100%)",
                }}
            >
                <div className="mx-auto flex h-full w-full max-w-sm flex-col justify-center">
                    <header className="bb-copy text-center">
                        <p className="text-[12px] font-normal leading-none text-white/80">
                            Welcome to
                        </p>

                        <h1 className="mt-2 whitespace-nowrap text-[clamp(1.9rem,8.6vw,2.45rem)] font-bold leading-none tracking-[-0.06em]">
                            <span className="text-white">
                                Bachelor
                            </span>

                            <span className="text-[#FFC247]">
                                Bite!
                            </span>
                        </h1>

                        <p className="mx-auto mt-3 max-w-[280px] px-2 text-[11.5px] font-normal leading-[1.55] text-white/72">
                            Meals, shopping, and shared expenses—sorted without
                            the roommate drama.
                        </p>
                    </header>

                    <div className="bb-actions mt-5 space-y-3">
                        <button
                            type="button"
                            onClick={() =>
                                openAuthPage("signup")
                            }
                            disabled={
                                transitionMode !== null
                            }
                            className="flex h-[49px] w-full items-center justify-center rounded-full bg-[#FFF9EC] px-5 text-[13px] font-semibold text-[#071F17] shadow-[0_9px_24px_rgba(0,0,0,0.14)] transition-transform duration-200 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
                        >
                            Create Account
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                openAuthPage("login")
                            }
                            disabled={
                                transitionMode !== null
                            }
                            className="flex h-[49px] w-full items-center justify-center rounded-full bg-[#FFC247] px-5 text-[13px] font-semibold text-[#071F17] shadow-[0_9px_24px_rgba(255,194,71,0.14)] transition-transform duration-200 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
                        >
                            Log In
                        </button>
                    </div>
                </div>
            </section>

            <style jsx>{`
        .bb-scenery {
          animation: scene-enter 650ms
            cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }

        .bb-cloud-left {
          animation: cloud-left 10s
            ease-in-out infinite;
        }

        .bb-cloud-right {
          animation: cloud-right 12s
            ease-in-out infinite;
        }

        .bb-mascot {
          transform-origin: center bottom;
          animation: mascot-enter 650ms
            cubic-bezier(0.22, 1, 0.36, 1)
            420ms both;
        }

        .bb-welcome-card {
          animation: card-enter 700ms
            cubic-bezier(0.22, 1, 0.36, 1)
            820ms both;
        }

        .bb-copy {
          animation: copy-enter 420ms ease
            980ms both;
        }

        .bb-actions {
          animation: actions-enter 450ms
            cubic-bezier(0.22, 1, 0.36, 1)
            1100ms both;
        }

        @keyframes scene-enter {
          from {
            opacity: 0;
            transform: translateY(70px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cloud-left {
          0%,
          100% {
            transform: translateX(0);
          }

          50% {
            transform: translateX(7px);
          }
        }

        @keyframes cloud-right {
          0%,
          100% {
            transform: translateX(0);
          }

          50% {
            transform: translateX(-8px);
          }
        }

        @keyframes mascot-enter {
          from {
            opacity: 0;
            transform: translateY(54px) scale(0.97);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes card-enter {
          from {
            opacity: 0;
            transform: translateY(100%);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes copy-enter {
          from {
            opacity: 0;
            transform: translateY(7px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes actions-enter {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-height: 720px) {
          .bb-welcome-card {
            padding-top: 15px;
          }

          .bb-actions {
            margin-top: 14px;
          }
        }

        @media (max-height: 660px) {
          .bb-welcome-card {
            padding-top: 12px;
          }

          .bb-actions {
            margin-top: 11px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .bb-scenery,
          .bb-cloud-left,
          .bb-cloud-right,
          .bb-mascot,
          .bb-welcome-card,
          .bb-copy,
          .bb-actions {
            animation: none;
          }
        }
      `}</style>
        </main>
    );
}
