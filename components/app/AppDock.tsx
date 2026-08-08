"use client";

import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  MessageCircle,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import { doc } from "firebase/firestore";
import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  useDoc,
  useUser,
} from "@/firebase";
import {
  auth,
  firestore,
} from "@/firebase/config";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { cn } from "@/lib/utils";

const ICON_PATH =
  "/crocodile_float_icon.png";

const STORAGE_KEY =
  "bachelorbite-floating-navigation-position";

const BUTTON_SIZE = 68;
const EDGE_GAP = 14;
const TOP_GUARD = 84;
const BOTTOM_GUARD = 92;
const DRAG_THRESHOLD = 6;

const MENU_WIDTH = 224;
const MENU_HEIGHT = 248;
const MENU_GAP = 12;
const MENU_EDGE_GAP = 12;

/*
 * এই route-গুলো public।
 * এখানে floating navigation কখনো দেখা যাবে না।
 */
const PUBLIC_ROUTE_PREFIXES = [
  "/login",
  "/signup",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/auth",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];

type DockSide =
  | "left"
  | "right";

type FloatingPosition = {
  x: number;
  y: number;
  side: DockSide;
};

type SavedPosition = {
  side: DockSide;
  yRatio: number;
};

type ViewportSize = {
  width: number;
  height: number;
};

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

type DragState = {
  pointerId: number;

  startPointerX: number;
  startPointerY: number;

  startX: number;
  startY: number;

  currentX: number;
  currentY: number;

  moved: boolean;
};

const clamp = (
  value: number,
  minimum: number,
  maximum: number
): number => {
  return Math.min(
    Math.max(
      value,
      minimum
    ),
    maximum
  );
};

const isDockSide = (
  value: unknown
): value is DockSide => {
  return (
    value === "left" ||
    value === "right"
  );
};

const isPublicPath = (
  pathname: string
): boolean => {
  /*
   * Landing page public।
   */
  if (pathname === "/") {
    return true;
  }

  return PUBLIC_ROUTE_PREFIXES.some(
    (route) => {
      return (
        pathname === route ||
        pathname.startsWith(
          `${route}/`
        )
      );
    }
  );
};

const getVerticalBounds = (
  viewportHeight: number
) => {
  const minimumY = Math.min(
    TOP_GUARD,
    Math.max(
      EDGE_GAP,
      viewportHeight -
      BUTTON_SIZE -
      EDGE_GAP
    )
  );

  const maximumY = Math.max(
    minimumY,
    viewportHeight -
    BUTTON_SIZE -
    BOTTOM_GUARD
  );

  return {
    minimumY,
    maximumY,
  };
};

const getSnappedX = (
  side: DockSide,
  viewportWidth: number
): number => {
  if (side === "left") {
    return EDGE_GAP;
  }

  return Math.max(
    EDGE_GAP,
    viewportWidth -
    BUTTON_SIZE -
    EDGE_GAP
  );
};

const getYRatio = (
  y: number,
  viewportHeight: number
): number => {
  const {
    minimumY,
    maximumY,
  } = getVerticalBounds(
    viewportHeight
  );

  if (
    maximumY === minimumY
  ) {
    return 0.5;
  }

  return clamp(
    (y - minimumY) /
    (maximumY - minimumY),
    0,
    1
  );
};

const getYFromRatio = (
  yRatio: number,
  viewportHeight: number
): number => {
  const {
    minimumY,
    maximumY,
  } = getVerticalBounds(
    viewportHeight
  );

  return (
    minimumY +
    clamp(
      yRatio,
      0,
      1
    ) *
    (maximumY -
      minimumY)
  );
};

const readSavedPosition =
  (): SavedPosition => {
    const fallback:
      SavedPosition = {
      side: "right",
      yRatio: 0.5,
    };

    try {
      const rawValue =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      if (!rawValue) {
        return fallback;
      }

      const parsedValue =
        JSON.parse(
          rawValue
        ) as Partial<SavedPosition>;

      if (
        !isDockSide(
          parsedValue.side
        )
      ) {
        return fallback;
      }

      const yRatio =
        Number(
          parsedValue.yRatio
        );

      if (
        !Number.isFinite(
          yRatio
        )
      ) {
        return fallback;
      }

      return {
        side:
          parsedValue.side,

        yRatio:
          clamp(
            yRatio,
            0,
            1
          ),
      };
    } catch {
      return fallback;
    }
  };

const savePosition = (
  position: FloatingPosition,
  viewportHeight: number
): void => {
  try {
    const savedPosition:
      SavedPosition = {
      side:
        position.side,

      yRatio:
        getYRatio(
          position.y,
          viewportHeight
        ),
    };

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        savedPosition
      )
    );
  } catch {
    /*
     * Browser storage unavailable হলেও
     * floating navigation কাজ করবে।
     */
  }
};

export default function AppDock() {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const {
    user,
    isUserLoading,
  } = useUser();

  /*
   * Firebase Authentication-এর সরাসরি state।
   * Custom provider update হওয়ার অপেক্ষা করতে হবে না।
   */
  const [
    authenticatedUserId,
    setAuthenticatedUserId,
  ] = useState<
    string | null
  >(null);

  const [
    isAuthResolved,
    setIsAuthResolved,
  ] = useState(false);

  const [
    position,
    setPosition,
  ] =
    useState<FloatingPosition | null>(
      null
    );

  const [
    viewport,
    setViewport,
  ] =
    useState<ViewportSize>({
      width: 0,
      height: 0,
    });

  const [
    isMenuOpen,
    setIsMenuOpen,
  ] = useState(false);

  const [
    isDragging,
    setIsDragging,
  ] = useState(false);

  const buttonRef =
    useRef<HTMLButtonElement>(
      null
    );

  const menuRef =
    useRef<HTMLElement>(
      null
    );

  const suppressClickRef =
    useRef(false);

  const dragStateRef =
    useRef<DragState | null>(
      null
    );

  const positionRef =
    useRef<FloatingPosition | null>(
      null
    );

  const viewportRef =
    useRef<ViewportSize>({
      width: 0,
      height: 0,
    });

  /*
   * Firebase sign-out হলে listener সঙ্গে সঙ্গে null দেয়।
   * তখন floating button আর render হবে না।
   */
  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (
          authenticatedUser
        ) => {
          setAuthenticatedUserId(
            authenticatedUser?.uid ??
            null
          );

          setIsAuthResolved(
            true
          );

          if (
            !authenticatedUser
          ) {
            setIsMenuOpen(
              false
            );

            setIsDragging(
              false
            );

            dragStateRef.current =
              null;
          }
        }
      );

    return unsubscribe;
  }, []);

  const publicRoute =
    useMemo(() => {
      return isPublicPath(
        pathname
      );
    }, [pathname]);

  /*
   * Custom useUser state এবং Firebase Auth state
   * একই user নির্দেশ করলে তবেই private data পড়া হবে।
   */
  const hasAuthenticatedUser =
    Boolean(
      isAuthResolved &&
      authenticatedUserId &&
      user &&
      user.uid ===
      authenticatedUserId
    );

  const userDocRef =
    useMemo(() => {
      if (
        !user ||
        !authenticatedUserId ||
        user.uid !==
        authenticatedUserId
      ) {
        return null;
      }

      return doc(
        firestore,
        "users",
        user.uid
      );
    }, [
      user,
      authenticatedUserId,
    ]);

  const {
    data: userData,
  } = useDoc(
    userDocRef
  );

  const groupId =
    userData?.groupId;

  const {
    unreadCount,
  } = useUnreadMessages(
    groupId,
    authenticatedUserId ??
    undefined
  );

  const navigationItems =
    useMemo<
      NavigationItem[]
    >(
      () => [
        {
          href:
            "/dashboard",
          label:
            "Dashboard",
          icon:
            LayoutDashboard,
        },
        {
          href:
            "/shopping-list",
          label:
            "Shopping List",
          icon:
            ShoppingBasket,
        },
        {
          href:
            "/report",
          label:
            "Monthly Report",
          icon:
            BarChart3,
        },
        {
          href:
            "/chat",
          label:
            "Chat",
          icon:
            MessageCircle,
          badge:
            unreadCount,
        },
      ],
      [unreadCount]
    );

  const updatePosition =
    useCallback(
      (
        nextPosition:
          FloatingPosition
      ) => {
        positionRef.current =
          nextPosition;

        setPosition(
          nextPosition
        );
      },
      []
    );

  /*
   * পুরোনো bottom dock-এর body padding সরিয়ে দেয়।
   */
  useEffect(() => {
    document.body.classList.remove(
      "pb-24"
    );
  }, []);

  /*
   * প্রথমবার saved position load।
   */
  useEffect(() => {
    const nextViewport:
      ViewportSize = {
      width:
        window.innerWidth,

      height:
        window.innerHeight,
    };

    const savedPosition =
      readSavedPosition();

    const nextPosition:
      FloatingPosition = {
      side:
        savedPosition.side,

      x:
        getSnappedX(
          savedPosition.side,
          nextViewport.width
        ),

      y:
        getYFromRatio(
          savedPosition.yRatio,
          nextViewport.height
        ),
    };

    viewportRef.current =
      nextViewport;

    setViewport(
      nextViewport
    );

    updatePosition(
      nextPosition
    );
  }, [updatePosition]);

  /*
   * Screen resize বা orientation change হলে
   * icon screen-এর ভিতরে থাকবে।
   */
  useEffect(() => {
    const handleResize =
      () => {
        const nextViewport:
          ViewportSize = {
          width:
            window.innerWidth,

          height:
            window.innerHeight,
        };

        const currentViewport =
          viewportRef.current;

        viewportRef.current =
          nextViewport;

        setViewport(
          nextViewport
        );

        const currentPosition =
          positionRef.current;

        if (
          !currentPosition
        ) {
          return;
        }

        const previousHeight =
          currentViewport.height ||
          nextViewport.height;

        const yRatio =
          getYRatio(
            currentPosition.y,
            previousHeight
          );

        const nextPosition:
          FloatingPosition = {
          side:
            currentPosition.side,

          x:
            getSnappedX(
              currentPosition.side,
              nextViewport.width
            ),

          y:
            getYFromRatio(
              yRatio,
              nextViewport.height
            ),
        };

        updatePosition(
          nextPosition
        );

        savePosition(
          nextPosition,
          nextViewport.height
        );
      };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, [updatePosition]);

  /*
   * Public page, logout অথবা route change হলে
   * menu এবং drag state বন্ধ হবে।
   */
  useEffect(() => {
    setIsMenuOpen(false);

    if (
      publicRoute ||
      !hasAuthenticatedUser
    ) {
      setIsDragging(false);

      dragStateRef.current =
        null;

      suppressClickRef.current =
        false;
    }
  }, [
    pathname,
    publicRoute,
    hasAuthenticatedUser,
  ]);

  /*
   * Menu-এর বাইরে click অথবা Escape চাপলে বন্ধ।
   */
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleOutsidePointerDown =
      (
        event: PointerEvent
      ) => {
        const target =
          event.target as Node;

        if (
          buttonRef.current?.contains(
            target
          ) ||
          menuRef.current?.contains(
            target
          )
        ) {
          return;
        }

        setIsMenuOpen(
          false
        );
      };

    const handleEscape =
      (
        event: KeyboardEvent
      ) => {
        if (
          event.key ===
          "Escape"
        ) {
          setIsMenuOpen(
            false
          );

          buttonRef.current?.focus();
        }
      };

    document.addEventListener(
      "pointerdown",
      handleOutsidePointerDown
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsidePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isMenuOpen]);

  const handlePointerDown =
    (
      event:
        ReactPointerEvent<HTMLButtonElement>
    ) => {
      if (
        !position ||
        event.button !== 0
      ) {
        return;
      }

      event.currentTarget.setPointerCapture(
        event.pointerId
      );

      dragStateRef.current =
      {
        pointerId:
          event.pointerId,

        startPointerX:
          event.clientX,

        startPointerY:
          event.clientY,

        startX:
          position.x,

        startY:
          position.y,

        currentX:
          position.x,

        currentY:
          position.y,

        moved:
          false,
      };
    };

  const handlePointerMove =
    (
      event:
        ReactPointerEvent<HTMLButtonElement>
    ) => {
      const dragState =
        dragStateRef.current;

      if (
        !dragState ||
        dragState.pointerId !==
        event.pointerId
      ) {
        return;
      }

      const deltaX =
        event.clientX -
        dragState.startPointerX;

      const deltaY =
        event.clientY -
        dragState.startPointerY;

      const movementDistance =
        Math.hypot(
          deltaX,
          deltaY
        );

      if (
        !dragState.moved &&
        movementDistance <
        DRAG_THRESHOLD
      ) {
        return;
      }

      if (
        !dragState.moved
      ) {
        dragState.moved =
          true;

        setIsDragging(
          true
        );

        setIsMenuOpen(
          false
        );
      }

      const currentViewport =
        viewportRef.current;

      const {
        minimumY,
        maximumY,
      } = getVerticalBounds(
        currentViewport.height
      );

      const maximumX =
        Math.max(
          EDGE_GAP,
          currentViewport.width -
          BUTTON_SIZE -
          EDGE_GAP
        );

      const nextX =
        clamp(
          dragState.startX +
          deltaX,
          EDGE_GAP,
          maximumX
        );

      const nextY =
        clamp(
          dragState.startY +
          deltaY,
          minimumY,
          maximumY
        );

      dragState.currentX =
        nextX;

      dragState.currentY =
        nextY;

      updatePosition({
        x: nextX,
        y: nextY,

        side:
          nextX +
            BUTTON_SIZE /
            2 <
            currentViewport.width /
            2
            ? "left"
            : "right",
      });
    };

  const finishDragging =
    (
      event:
        ReactPointerEvent<HTMLButtonElement>
    ) => {
      const dragState =
        dragStateRef.current;

      if (
        !dragState ||
        dragState.pointerId !==
        event.pointerId
      ) {
        return;
      }

      try {
        if (
          event.currentTarget.hasPointerCapture(
            event.pointerId
          )
        ) {
          event.currentTarget.releasePointerCapture(
            event.pointerId
          );
        }
      } catch {
        /*
         * Pointer capture ইতিমধ্যে release হলেও
         * component কাজ চালিয়ে যাবে।
         */
      }

      suppressClickRef.current =
        dragState.moved;

      if (
        dragState.moved
      ) {
        const currentViewport =
          viewportRef.current;

        const side:
          DockSide =
          dragState.currentX +
            BUTTON_SIZE /
            2 <
            currentViewport.width /
            2
            ? "left"
            : "right";

        const {
          minimumY,
          maximumY,
        } = getVerticalBounds(
          currentViewport.height
        );

        const snappedPosition:
          FloatingPosition = {
          side,

          x:
            getSnappedX(
              side,
              currentViewport.width
            ),

          y:
            clamp(
              dragState.currentY,
              minimumY,
              maximumY
            ),
        };

        updatePosition(
          snappedPosition
        );

        savePosition(
          snappedPosition,
          currentViewport.height
        );
      }

      dragStateRef.current =
        null;

      setIsDragging(
        false
      );
    };

  const handleMainButtonClick =
    () => {
      /*
       * Drag শেষ হওয়ার পর browser click fire করলে
       * menu যেন accidentally না খোলে।
       */
      if (
        suppressClickRef.current
      ) {
        suppressClickRef.current =
          false;

        return;
      }

      setIsMenuOpen(
        (
          currentValue
        ) => !currentValue
      );
    };

  const handleNavigate =
    (
      href: string
    ) => {
      setIsMenuOpen(
        false
      );

      if (
        pathname !== href
      ) {
        router.push(
          href
        );
      }
    };

  const isActiveRoute =
    (
      href: string
    ) => {
      return (
        pathname === href ||
        pathname.startsWith(
          `${href}/`
        )
      );
    };

  /*
   * সবচেয়ে গুরুত্বপূর্ণ render guard:
   *
   * - Firebase Auth resolve হয়নি
   * - user logout
   * - custom auth state stale
   * - public/login page
   * - position initialize হয়নি
   *
   * যেকোনো একটি সত্য হলে button render হবে না।
   */
  if (
    !isAuthResolved ||
    !authenticatedUserId ||
    !hasAuthenticatedUser ||
    isUserLoading ||
    publicRoute ||
    !position ||
    viewport.width === 0 ||
    viewport.height === 0
  ) {
    return null;
  }

  /*
   * Menu screen-এর উপরে বা নিচে চলে যাবে না।
   */
  const menuTop =
    clamp(
      position.y +
      BUTTON_SIZE / 2 -
      MENU_HEIGHT / 2,
      MENU_EDGE_GAP,
      Math.max(
        MENU_EDGE_GAP,
        viewport.height -
        MENU_HEIGHT -
        MENU_EDGE_GAP
      )
    );

  /*
   * Right side-এ থাকলে menu বামে খুলবে।
   * Left side-এ থাকলে menu ডানে খুলবে।
   */
  const rawMenuLeft =
    position.side ===
      "right"
      ? position.x -
      MENU_GAP -
      MENU_WIDTH
      : position.x +
      BUTTON_SIZE +
      MENU_GAP;

  const menuLeft =
    clamp(
      rawMenuLeft,
      MENU_EDGE_GAP,
      Math.max(
        MENU_EDGE_GAP,
        viewport.width -
        MENU_WIDTH -
        MENU_EDGE_GAP
      )
    );

  return (
    <>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.nav
            ref={menuRef}
            aria-label="Quick navigation"
            initial={{
              opacity: 0,

              x:
                position.side ===
                  "right"
                  ? 16
                  : -16,

              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,

              x:
                position.side ===
                  "right"
                  ? 12
                  : -12,

              scale: 0.97,
            }}
            transition={{
              type: "spring",
              stiffness: 360,
              damping: 28,
            }}
            className="bb-app-dock-menu fixed z-[79] w-56 rounded-2xl border border-border bg-card p-2 text-card-foreground shadow-2xl"
            style={{
              left:
                menuLeft,

              top:
                menuTop,
            }}
          >
            <div className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Quick navigation
            </div>

            <div className="space-y-1">
              {navigationItems.map(
                (item) => {
                  const Icon =
                    item.icon;

                  const isActive =
                    isActiveRoute(
                      item.href
                    );

                  return (
                    <button
                      key={
                        item.href
                      }
                      type="button"
                      onClick={() => {
                        handleNavigate(
                          item.href
                        );
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",

                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      )}
                      aria-current={
                        isActive
                          ? "page"
                          : undefined
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" />

                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>

                      {item.badge &&
                        item.badge >
                        0 ? (
                        <span
                          className={cn(
                            "flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold",

                            isActive
                              ? "bg-primary-foreground text-primary"
                              : "bg-destructive text-destructive-foreground"
                          )}
                        >
                          {item.badge >
                            99
                            ? "99+"
                            : item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                }
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <button
        ref={buttonRef}
        type="button"
        aria-label={
          isMenuOpen
            ? "Close navigation menu"
            : "Open navigation menu"
        }
        aria-expanded={
          isMenuOpen
        }
        onClick={
          handleMainButtonClick
        }
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          finishDragging
        }
        onPointerCancel={
          finishDragging
        }
        className={cn(
          "bb-app-dock-button fixed z-[80] h-[68px] w-[68px] touch-none select-none rounded-full border-[3px] border-[#f4d35e] bg-[#10291f] p-[5px] shadow-[0_12px_30px_rgba(0,0,0,0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d35e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1511]",

          isDragging
            ? "cursor-grabbing scale-[1.04]"
            : "cursor-grab transition-[left,top,transform,box-shadow] duration-300 ease-out hover:scale-[1.04] hover:shadow-[0_16px_38px_rgba(0,0,0,0.4)] active:scale-[0.98]"
        )}
        style={{
          left:
            position.x,

          top:
            position.y,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ICON_PATH}
          alt=""
          draggable={false}
          className="h-full w-full rounded-full object-contain drop-shadow-[0_2px_0_rgba(0,0,0,0.38)]"
        />

        {unreadCount >
          0 && (
            <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-[#f4d35e] bg-[#8f2335] px-1 text-[11px] font-semibold leading-none text-white shadow-md">
              {unreadCount >
                99
                ? "99+"
                : unreadCount}
            </span>
          )}
      </button>
    </>
  );
}