"use client";

import {
  type CSSProperties,
  type TouchEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  ArrowRight,
  BellRing,
  Boxes,
  Check,
  ClipboardList,
  FolderCheck,
  Hand,
  History,
  MessageCircle,
  PieChart,
  Scale,
  ShoppingBasket,
  SlidersHorizontal,
  UserRound,
  UsersRound,
  Utensils,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import styles from "./onboarding.module.css";

type AccentTone = "gold" | "terracotta" | "olive";

type OnboardingTag = {
  label: string;
  icon: LucideIcon;
  tone: AccentTone;
};

type OnboardingStep = {
  eyebrow: string;
  title: string;
  accentTitle: string;
  descriptionStart: string;
  descriptionHighlight: string;
  descriptionEnd: string;
  image: string;
  imageAlt: string;
  accentColor: string;
  tags: OnboardingTag[];
};

const SWIPE_DISTANCE = 48;

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    eyebrow: "Everyday inputs",
    title: "Add Once.",
    accentTitle: "Stay Updated.",
    descriptionStart: "Log daily activities and ",
    descriptionHighlight: "keep everyone connected.",
    descriptionEnd: "",
    image: "/onboarding/onboarding-input.webp",
    imageAlt:
      "A person adding meals, expenses, notices, chats, and profile details in BachelorBite.",
    accentColor: "#d5a63a",
    tags: [
      { label: "Dashboard: Meals & expenses", icon: Utensils, tone: "gold" },
      { label: "Notice: Group updates", icon: BellRing, tone: "terracotta" },
      { label: "Chat: Conversations", icon: MessageCircle, tone: "olive" },
      { label: "Profile: Photo & details", icon: UserRound, tone: "gold" },
    ],
  },
  {
    eyebrow: "Clear outputs",
    title: "See the Full",
    accentTitle: "Picture.",
    descriptionStart: "Turn everyday entries into ",
    descriptionHighlight: "clear reports",
    descriptionEnd: " and fair settlements.",
    image: "/onboarding/onboarding-output.webp",
    imageAlt:
      "A person reviewing meal, expense, inventory, and settlement reports.",
    accentColor: "#c87550",
    tags: [
      { label: "Monthly Summary", icon: PieChart, tone: "terracotta" },
      { label: "Meal Report", icon: ClipboardList, tone: "gold" },
      { label: "Expense Breakdown", icon: WalletCards, tone: "olive" },
      { label: "Inventory Status", icon: Boxes, tone: "gold" },
      { label: "Final Settlement", icon: Scale, tone: "terracotta" },
    ],
  },
  {
    eyebrow: "Flexible management",
    title: "Manage It",
    accentTitle: "Your Way.",
    descriptionStart: "Adjust meals, organize shopping, and ",
    descriptionHighlight: "manage your group",
    descriptionEnd: " with ease.",
    image: "/onboarding/onboarding-manage.webp",
    imageAlt:
      "A person managing meal types, urgent shopping, item claims, and group members.",
    accentColor: "#6f7b45",
    tags: [
      { label: "Customize Meal Types", icon: SlidersHorizontal, tone: "olive" },
      { label: "Add Urgent Shopping", icon: ShoppingBasket, tone: "terracotta" },
      { label: "Claim Items", icon: Hand, tone: "gold" },
      { label: "Manage Members", icon: UsersRound, tone: "olive" },
    ],
  },
  {
    eyebrow: "A simpler shared home",
    title: "Everything.",
    accentTitle: "One Place.",
    descriptionStart: "",
    descriptionHighlight: "No spreadsheets. No lost records.",
    descriptionEnd: " Just clear shared accounts and settlement history.",
    image: "/onboarding/onboarding-benefit.webp",
    imageAlt:
      "Two housemates with organized records and a fair settlement in one app.",
    accentColor: "#d5a63a",
    tags: [
      { label: "Stay Organized", icon: FolderCheck, tone: "gold" },
      { label: "Settle Fairly", icon: Scale, tone: "terracotta" },
      { label: "Find Records Anytime", icon: History, tone: "olive" },
    ],
  },
];

type OnboardingExperienceProps = {
  onComplete: () => void | Promise<void>;
  onSkip?: () => void | Promise<void>;
};

export function OnboardingLoadingScreen() {
  return (
    <div className={styles.loadingScreen} aria-label="Preparing onboarding">
      <div className={styles.loadingMark} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export function OnboardingExperience({
  onComplete,
  onSkip,
}: OnboardingExperienceProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [saveError, setSaveError] = useState("");
  const touchStartX = useRef<number | null>(null);
  const dialogRef = useRef<HTMLElement>(null);

  const step = ONBOARDING_STEPS[stepIndex];
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;

  const goToStep = (nextStep: number) => {
    setSaveError("");
    setStepIndex(
      Math.min(Math.max(nextStep, 0), ONBOARDING_STEPS.length - 1)
    );
  };

  const goForward = async () => {
    if (isClosing) {
      return;
    }

    if (!isLastStep) {
      goToStep(stepIndex + 1);
      return;
    }

    setIsClosing(true);
    setSaveError("");

    try {
      await onComplete();
    } catch (error) {
      console.error("Could not complete onboarding:", error);
      setSaveError("We could not save this yet. Please try again.");
      setIsClosing(false);
    }
  };

  const skipOnboarding = async () => {
    if (isClosing) {
      return;
    }

    setIsClosing(true);
    setSaveError("");

    try {
      await (onSkip ?? onComplete)();
    } catch (error) {
      console.error("Could not skip onboarding:", error);
      setSaveError("We could not save this yet. Please try again.");
      setIsClosing(false);
    }
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        void goForward();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToStep(stepIndex - 1);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        void skipOnboarding();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (touchStartX.current === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const movement = endX - touchStartX.current;
    touchStartX.current = null;

    if (movement <= -SWIPE_DISTANCE) {
      void goForward();
    } else if (movement >= SWIPE_DISTANCE) {
      goToStep(stepIndex - 1);
    }
  };

  const accentStyle = {
    "--bb-onboarding-accent": step.accentColor,
  } as CSSProperties;

  return (
    <div className={styles.root} style={accentStyle}>
      <section
        ref={dialogRef}
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bb-onboarding-title"
        tabIndex={-1}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          className={styles.skipButton}
          onClick={() => void skipOnboarding()}
          disabled={isClosing}
        >
          Skip
        </button>

        <div className={styles.visualPanel} key={`visual-${stepIndex}`}>
          <div className={styles.visualGlow} aria-hidden="true" />
          <Image
            src={step.image}
            alt={step.imageAlt}
            fill
            priority={stepIndex === 0}
            sizes="(max-width: 760px) 100vw, 55vw"
            className={styles.illustration}
          />
        </div>

        <div className={styles.contentPanel} key={`content-${stepIndex}`}>
          <p className={styles.eyebrow}>{step.eyebrow}</p>

          <h1 id="bb-onboarding-title" className={styles.title}>
            {step.title}{" "}
            <span>{step.accentTitle}</span>
          </h1>

          <p className={styles.description}>
            {step.descriptionStart}
            <strong>{step.descriptionHighlight}</strong>
            {step.descriptionEnd}
          </p>

          <div className={styles.tags} aria-label="Key features">
            {step.tags.map(({ label, icon: Icon, tone }) => (
              <div
                className={`${styles.tag} ${styles[`tag_${tone}`]}`}
                key={label}
              >
                <span className={styles.tagIcon} aria-hidden="true">
                  <Icon />
                </span>
                <span>{label}</span>
              </div>
            ))}
          </div>

          {saveError ? (
            <p className={styles.errorMessage} role="alert">
              {saveError}
            </p>
          ) : null}
        </div>

        <div className={styles.progress} aria-label="Onboarding progress">
          {ONBOARDING_STEPS.map((item, index) => (
            <button
              type="button"
              key={item.eyebrow}
              className={index === stepIndex ? styles.activeDot : styles.dot}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === stepIndex ? "step" : undefined}
              onClick={() => goToStep(index)}
              disabled={isClosing}
            />
          ))}
        </div>

        <button
          type="button"
          className={`${styles.nextButton} ${
            isLastStep ? styles.finishButton : ""
          }`}
          onClick={() => void goForward()}
          disabled={isClosing}
          aria-label={isLastStep ? "Get started" : "Next slide"}
        >
          <span>
            {isClosing ? (
              "Saving..."
            ) : isLastStep ? (
              <>
                Get Started <Check aria-hidden="true" />
              </>
            ) : (
              <ArrowRight aria-hidden="true" />
            )}
          </span>
        </button>
      </section>
    </div>
  );
}
