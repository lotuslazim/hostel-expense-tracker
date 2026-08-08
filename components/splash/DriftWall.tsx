"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";



export type DriftWallItem = {
  image: string;
  title?: string;
};

type DriftWallProps = {
  items: DriftWallItem[];
  columns?: number;
  tileWidth?: number;
  tileHeight?: number;
  gap?: number;
  radius?: number;
  tilt?: number;
  turn?: number;
  roll?: number;
  perspective?: number;
  depth?: number;
  speed?: number;
  direction?: "up" | "down";
  variance?: number;
  parallax?: number;
  fade?: number;
  dim?: number;
  grayscale?: boolean;
  overlayColor?: string;
  className?: string;
  style?: CSSProperties;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const columnFactor = (index: number, variance: number) => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;

  return 1 + variance * pseudo;
};

/*
 * Math.random ব্যবহার না করে একটি নির্দিষ্ট seed দিয়ে
 * ছবিগুলো shuffle করে।
 *
 * ফলে refresh করলেও ছবির arrangement হঠাৎ বদলে যাবে না।
 */
function seededShuffle<T>(source: T[], seed: number): T[] {
  const result = [...source];
  let value = seed >>> 0;

  for (
    let currentIndex = result.length - 1;
    currentIndex > 0;
    currentIndex -= 1
  ) {
    value = (value * 1664525 + 1013904223) >>> 0;

    const randomIndex = value % (currentIndex + 1);

    [result[currentIndex], result[randomIndex]] = [
      result[randomIndex],
      result[currentIndex],
    ];
  }

  return result;
}

export default function DriftWall({
  items,
  columns = 6,
  tileWidth = 156,
  tileHeight = 104,
  gap = 14,
  radius = 16,
  tilt = 15,
  turn = -13,
  roll = -2,
  perspective = 1050,
  depth = 100,
  speed = 34,
  direction = "up",
  variance = 0.38,
  parallax = 0,
  fade = 0.72,
  dim = 0.76,
  grayscale = false,
  overlayColor = "#06110d",
  className = "",
  style,
}: DriftWallProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const planeRef = useRef<HTMLDivElement | null>(null);

  const trackRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rafRef = useRef<number | null>(null);

  const offsetsRef = useRef<number[]>([]);

  const pointerRef = useRef({
    x: 0,
    y: 0,
  });

  const pointerDampedRef = useRef({
    x: 0,
    y: 0,
  });

  const lastTsRef = useRef<number | null>(null);

  const [containerHeight, setContainerHeight] = useState(700);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());

    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const handleChange = (event: MediaQueryListEvent) => {
      setReduced(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  /*
   * একই image path একাধিকবার থাকলে duplicate বাদ দেওয়া হবে।
   */
  const safeItems = useMemo(() => {
    const uniqueItems = Array.from(
      new Map(
        items
          .filter((item) => Boolean(item.image))
          .map((item) => [item.image, item] as const)
      ).values()
    );

    if (uniqueItems.length > 0) {
      return uniqueItems;
    }

    return [
      {
        image: "",
        title: "",
      },
    ];
  }, [items]);

  /*
   * আগের code-এ ১৫টি ছবি ৬টি column-এ ভাগ হয়ে যাচ্ছিল।
   * ফলে প্রতি column-এ মাত্র ২–৩টি ছবি থাকত এবং দ্রুত repeat করত।
   *
   * এখন প্রত্যেক column-এ সবগুলো ছবি থাকবে।
   * শুধু প্রতিটি column আলাদা position থেকে শুরু করবে।
   */
  const columnItems = useMemo(() => {
    const columnCount = Math.max(
      1,
      Math.floor(columns)
    );

    const masterOrder = seededShuffle(
      safeItems,
      20260805
    );

    const shiftStep = Math.max(
      1,
      Math.floor(
        masterOrder.length / columnCount
      )
    );

    return Array.from(
      {
        length: columnCount,
      },
      (_, columnIndex) => {
        const shift =
          (columnIndex * shiftStep) %
          masterOrder.length;

        return [
          ...masterOrder.slice(shift),
          ...masterOrder.slice(0, shift),
        ];
      }
    );
  }, [columns, safeItems]);

  const columnMeta = useMemo(() => {
    const unit = tileHeight + gap;

    return columnItems.map((column) => {
      const copyHeight = Math.max(
        unit,
        column.length * unit
      );

      /*
       * প্রতিটি column-এ এখন সব ছবি থাকায়
       * seamless loop-এর জন্য ২টি copy যথেষ্ট।
       */
      const copies = Math.max(
        2,
        Math.ceil(
          (containerHeight * 1.9) /
          copyHeight
        ) + 1
      );

      return {
        copyHeight,
        copies,
      };
    });
  }, [
    columnItems,
    containerHeight,
    gap,
    tileHeight,
  ]);

  useLayoutEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver(
      ([entry]) => {
        setContainerHeight(
          entry.contentRect.height || 700
        );
      }
    );

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const baseVelocities = useMemo(() => {
    const directionSign =
      direction === "up" ? 1 : -1;

    return columnItems.map(
      (_, columnIndex) => {
        const alternatingSign =
          columnIndex % 2 === 0 ? 1 : -1;

        return (
          speed *
          columnFactor(
            columnIndex,
            variance
          ) *
          directionSign *
          alternatingSign
        );
      }
    );
  }, [
    columnItems,
    direction,
    speed,
    variance,
  ]);

  useEffect(() => {
    offsetsRef.current = columnMeta.map(
      (meta, columnIndex) =>
        meta.copyHeight *
        ((columnIndex * 0.37) % 1)
    );
  }, [columnMeta]);

  const applyPlaneTransform = useCallback(
    (
      pointerX: number,
      pointerY: number
    ) => {
      const plane = planeRef.current;

      if (!plane) {
        return;
      }

      plane.style.transform =
        `translate(-50%, -50%) scale(1.38) ` +
        `rotateX(${tilt + pointerY}deg) ` +
        `rotateY(${turn + pointerX}deg) ` +
        `rotateZ(${roll}deg) ` +
        `translateZ(${-depth}px)`;
    },
    [
      depth,
      roll,
      tilt,
      turn,
    ]
  );

  useEffect(() => {
    const animate = (
      timestamp: number
    ) => {
      if (lastTsRef.current === null) {
        lastTsRef.current = timestamp;
      }

      const deltaTime = Math.min(
        0.05,
        Math.max(
          0,
          timestamp -
          lastTsRef.current
        ) / 1000
      );

      lastTsRef.current = timestamp;

      const maxTilt = parallax * 8;

      const targetX =
        pointerRef.current.x * maxTilt;

      const targetY =
        -pointerRef.current.y * maxTilt;

      const damping =
        1 -
        Math.exp(
          -deltaTime / 0.12
        );

      pointerDampedRef.current.x +=
        (targetX -
          pointerDampedRef.current.x) *
        damping;

      pointerDampedRef.current.y +=
        (targetY -
          pointerDampedRef.current.y) *
        damping;

      applyPlaneTransform(
        pointerDampedRef.current.x,
        pointerDampedRef.current.y
      );

      for (
        let columnIndex = 0;
        columnIndex <
        trackRefs.current.length;
        columnIndex += 1
      ) {
        const track =
          trackRefs.current[columnIndex];

        const meta =
          columnMeta[columnIndex];

        if (!track || !meta) {
          continue;
        }

        if (reduced) {
          track.style.transform =
            `translate3d(0, ${-(
              offsetsRef.current[
              columnIndex
              ] ?? 0
            )}px, 0)`;

          continue;
        }

        let nextOffset =
          (offsetsRef.current[
            columnIndex
          ] ?? 0) +
          baseVelocities[
          columnIndex
          ] *
          deltaTime;

        nextOffset =
          ((nextOffset %
            meta.copyHeight) +
            meta.copyHeight) %
          meta.copyHeight;

        offsetsRef.current[
          columnIndex
        ] = nextOffset;

        track.style.transform =
          `translate3d(0, ${-nextOffset}px, 0)`;
      }

      rafRef.current =
        window.requestAnimationFrame(
          animate
        );
    };

    rafRef.current =
      window.requestAnimationFrame(
        animate
      );

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(
          rafRef.current
        );
      }

      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [
    applyPlaneTransform,
    baseVelocities,
    columnMeta,
    parallax,
    reduced,
  ]);

  const handlePointerMove = useCallback(
    (
      event: React.PointerEvent<HTMLDivElement>
    ) => {
      if (
        parallax <= 0 ||
        reduced
      ) {
        return;
      }

      const rect =
        containerRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      pointerRef.current = {
        x:
          (event.clientX -
            rect.left) /
          rect.width -
          0.5,

        y:
          (event.clientY -
            rect.top) /
          rect.height -
          0.5,
      };
    },
    [
      parallax,
      reduced,
    ]
  );

  const cssVariables = useMemo(
    () =>
      ({
        "--dw-tile-w": `${tileWidth}px`,
        "--dw-tile-h": `${tileHeight}px`,
        "--dw-gap": `${gap}px`,
        "--dw-radius": `${radius}px`,
        "--dw-perspective": `${perspective}px`,
        "--dw-dim": dim,
        "--dw-gray": grayscale ? 1 : 0,
        "--dw-overlay": overlayColor,
        "--dw-edge": `${Math.max(
          0,
          (1 - fade) * 100
        )}%`,
        ...style,
      }) as CSSProperties,
    [
      dim,
      fade,
      gap,
      grayscale,
      overlayColor,
      perspective,
      radius,
      style,
      tileHeight,
      tileWidth,
    ]
  );

  const rootClassName = [
    "drift-wall",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={containerRef}
      className={rootClassName}
      style={cssVariables}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        pointerRef.current = {
          x: 0,
          y: 0,
        };
      }}
      aria-hidden="true"
    >
      <div
        ref={planeRef}
        className="drift-wall__plane"
      >
        {columnItems.map(
          (
            column,
            columnIndex
          ) => {
            const meta =
              columnMeta[columnIndex];

            const copies = Array.from({
              length: meta.copies,
            });

            return (
              <div
                className="drift-wall__col"
                key={`column-${columnIndex}`}
              >
                <div
                  className="drift-wall__track"
                  ref={(element) => {
                    trackRefs.current[
                      columnIndex
                    ] = element;
                  }}
                >
                  {copies.map(
                    (
                      _,
                      copyIndex
                    ) =>
                      column.map(
                        (
                          item,
                          itemIndex
                        ) => (
                          <div
                            className="drift-wall__tile"
                            key={`${columnIndex}-${copyIndex}-${itemIndex}-${item.image}`}
                          >
                            <span className="drift-wall__inner">
                              {item.image ? (
                                <img
                                  src={
                                    item.image
                                  }
                                  alt=""
                                  loading="eager"
                                  decoding="async"
                                  draggable={
                                    false
                                  }
                                />
                              ) : null}

                              <span
                                className="drift-wall__overlay"
                                aria-hidden="true"
                              />
                            </span>
                          </div>
                        )
                      )
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}