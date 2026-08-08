"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";

import DriftWall, {
  type DriftWallItem,
} from "./DriftWall";

type DriftWallSplashProps = {
  isReady?: boolean;
  minimumDuration?: number;
  onComplete?: () => void;
};

const IMAGE_COUNT = 15;

/*
 * Subtitle 4 seconds পরে আসা শুরু করবে।
 * 1.6 seconds পরে সম্পূর্ণ visible হবে।
 * সম্পূর্ণ visible হওয়ার পরে কমপক্ষে 3 seconds থাকবে।
 */
const SUBTITLE_FULLY_VISIBLE_AT = 5600;
const SUBTITLE_HOLD_DURATION = 3000;

/*
 * Splash exit শেষ হলে landing page mount হবে।
 */
const EXIT_DURATION = 520;

export default function DriftWallSplash({
  isReady = true,
  minimumDuration = 8400,
  onComplete,
}: DriftWallSplashProps) {
  const [
    timelineFinished,
    setTimelineFinished,
  ] = useState(false);

  const [isLeaving, setIsLeaving] =
    useState(false);

  const completionStartedRef =
    useRef(false);

  const items = useMemo<DriftWallItem[]>(
    () =>
      Array.from(
        {
          length: IMAGE_COUNT,
        },
        (_, index) => ({
          image: `/splash-wall/wall-${String(
            index + 1
          ).padStart(2, "0")}.webp`,

          title: `BachelorBite memory ${index + 1
            }`,
        })
      ),
    []
  );

  /*
   * Splash minimum duration।
   * Subtitle clear হওয়ার পর অন্তত 3 seconds
   * screen-এ রাখবে।
   */
  useEffect(() => {
    const earliestExitTime = Math.max(
      minimumDuration,
      SUBTITLE_FULLY_VISIBLE_AT +
      SUBTITLE_HOLD_DURATION
    );

    const timer = window.setTimeout(() => {
      setTimelineFinished(true);
    }, earliestExitTime);

    return () => {
      window.clearTimeout(timer);
    };
  }, [minimumDuration]);

  /*
   * Timeline এবং application readiness—
   * দুটো complete হলে splash exit শুরু হবে।
   */
  useEffect(() => {
    if (
      !isReady ||
      !timelineFinished ||
      !onComplete ||
      completionStartedRef.current
    ) {
      return;
    }

    completionStartedRef.current = true;
    setIsLeaving(true);

    const timer = window.setTimeout(() => {
      onComplete();
    }, EXIT_DURATION);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    isReady,
    onComplete,
    timelineFinished,
  ]);

  const titleShadowStyle = {
    textShadow: `
      0 12px 30px rgba(0, 0, 0, 0.68),
      0 4px 10px rgba(0, 0, 0, 0.58),
      0 1px 2px rgba(0, 0, 0, 0.48)
    `,
  } as const;

  return (
    <motion.main
      className="fixed inset-0 z-[1000] overflow-hidden bg-[#050505]"
      initial={{
        opacity: 0,
        scale: 1,
        filter: "blur(0px)",
      }}
      animate={
        isLeaving
          ? {
            opacity: 0,
            scale: 1.025,
            filter: "blur(8px)",
          }
          : {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
          }
      }
      transition={{
        duration: isLeaving
          ? EXIT_DURATION / 1000
          : 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        willChange:
          "opacity, transform, filter",
      }}
      role="status"
      aria-live="polite"
      aria-label="BachelorBite is loading"
    >
      {/* Moving photo wall */}
      <motion.div
        className="absolute -inset-4 scale-[1.1]"
        animate={
          isLeaving
            ? {
              scale: 1.14,
            }
            : {
              scale: 1.1,
            }
        }
        transition={{
          duration:
            EXIT_DURATION / 1000,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          filter:
            "blur(2.2px) saturate(0.92)",
          willChange:
            "transform, filter",
        }}
      >
        <DriftWall
          items={items}
          columns={6}
          tileWidth={156}
          tileHeight={104}
          gap={14}
          radius={16}
          tilt={15}
          turn={-13}
          roll={-2}
          perspective={1050}
          depth={100}
          speed={34}
          direction="up"
          variance={0.38}
          parallax={0}
          fade={0.72}
          dim={0.82}
          grayscale={false}
          overlayColor="#060606"
        />
      </motion.div>

      {/* Overall dark overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/70"
      />

      {/* Center readability overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.06)_0%,rgba(0,0,0,0.24)_42%,rgba(0,0,0,0.72)_100%)]"
      />

      <div className="relative z-10 flex h-full w-full items-center justify-center px-4">
        <div className="flex w-full max-w-5xl flex-col items-center justify-center text-center">
          <h1
            className="flex items-end justify-center whitespace-nowrap font-body text-[clamp(2.7rem,11vw,6.8rem)] font-black leading-[0.88] tracking-[-0.075em]"
            aria-label="BachelorBite"
          >
            {/* Bachelor */}
            <motion.span
              className="inline-block text-white"
              style={titleShadowStyle}
              initial={{
                opacity: 0,
                y: -120,
                rotate: -2,
                scale: 0.96,
                filter: "blur(7px)",
              }}
              animate={{
                opacity: 1,
                y: 0,
                rotate: 0,
                scale: 1,
                filter: "blur(0px)",
              }}
              transition={{
                delay: 0.9,
                duration: 1.2,
                type: "spring",
                stiffness: 115,
                damping: 18,
                mass: 1,
              }}
            >
              Bachelor
            </motion.span>

            {/* Bite */}
            <motion.span
              className="inline-block text-[#F4C542]"
              style={titleShadowStyle}
              initial={{
                opacity: 0,
                y: -120,
                rotate: 2,
                scale: 0.96,
                filter: "blur(7px)",
              }}
              animate={{
                opacity: 1,
                y: 0,
                rotate: 0,
                scale: 1,
                filter: "blur(0px)",
              }}
              transition={{
                delay: 1.9,
                duration: 1.2,
                type: "spring",
                stiffness: 115,
                damping: 18,
                mass: 1,
              }}
            >
              Bite
            </motion.span>

            {/* Fixed-position colored dot */}
            <motion.span
              className="inline-block"
              style={{
                marginLeft: "0.07em",
              }}
              initial={{
                opacity: 0,
                filter: "blur(3px)",
              }}
              animate={{
                opacity: 1,
                filter: "blur(0px)",
              }}
              transition={{
                delay: 2.9,
                duration: 0.55,
                ease: "easeOut",
              }}
            >
              <motion.span
                className="inline-block"
                initial={{
                  color: "#FFFFFF",
                }}
                animate={{
                  color: [
                    "#FFFFFF",
                    "#F4C542",
                    "#4ADE80",
                    "#EF4444",
                    "#60A5FA",
                    "#C084FC",
                    "#FFFFFF",
                  ],
                }}
                transition={{
                  delay: 3.4,
                  duration: 3.6,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                .
              </motion.span>
            </motion.span>
          </h1>

          {/* Subtitle */}
          <motion.p
            className="mt-6 whitespace-nowrap text-[clamp(0.72rem,2vw,0.98rem)] font-normal uppercase text-white/95"
            style={{
              letterSpacing: "0.34em",
              transform: "scaleX(1.06)",
              transformOrigin: "center",
              textShadow:
                "0 3px 10px rgba(0, 0, 0, 0.64)",
              fontFamily:
                '"Arial Narrow", "Aptos Narrow", "Roboto Condensed", "Helvetica Neue", Arial, sans-serif',
            }}
            initial={{
              opacity: 0,
              filter: "blur(12px)",
            }}
            animate={{
              opacity: 1,
              filter: "blur(0px)",
            }}
            transition={{
              delay: 4,
              duration: 1.6,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
          >
            Made of Memories
          </motion.p>
        </div>
      </div>
    </motion.main>
  );
}