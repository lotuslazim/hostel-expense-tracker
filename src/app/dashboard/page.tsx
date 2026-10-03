"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import {
  addMonths,
  endOfMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import {
  LayoutDashboard,
} from "lucide-react";

import {
  useCollection,
  useDoc,
  useFirebase,
  useUser,
} from "@/firebase";

import type {
  Expense,
} from "@/lib/types";

import {
  AddExpenseCard,
} from "@/components/dashboard/AddExpenseCard";
import {
  LogMealCard,
} from "@/components/dashboard/LogMealCard";
import {
  ActivityFeed,
} from "@/components/dashboard/ActivityFeed";
import {
  DateCard,
} from "@/components/dashboard/DateCard";
import {
  SendReminderCard,
} from "@/components/dashboard/SendReminderCard";
import {
  UserManualReminder,
} from "@/components/dashboard/UserManualReminder";
import {
  AwayToggleCard,
} from "@/components/dashboard/AwayToggleCard";

import {
  AppHeader,
} from "@/components/app/header";
import {
  AppBrandLoader,
} from "@/components/app/AppBrandLoader";
import {
  Welcome,
} from "@/components/app/welcome";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Skeleton,
} from "@/components/ui/skeleton";

type UserProfileRecord = {
  id?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;

  groupId?: string | null;
  isAdmin?: boolean;
  onboardingCompletedAt?: unknown;
  onboardingVersion?: number;
  userManualReminderSeenAt?: unknown;
};

type GroupRecord = {
  id?: string;
  groupName?: string;
  invitationCode?: string;
  adminId?: string;

  settings?: {
    mealTypes?: string[];
    isMealItemNameRequired?: boolean;
    isExpenseDescriptionRequired?: boolean;
    isUtilityReceiptRequired?: boolean;
  };
};

const getErrorMessage = (
  error: unknown
): string => {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return "Something went wrong while loading the dashboard.";
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-[28rem] w-full rounded-lg" />
          <Skeleton className="h-[28rem] w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>

        <div className="lg:col-span-3">
          <Skeleton className="h-[calc(100vh-10rem)] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function AuthenticationRedirect() {
  return (
    <AppBrandLoader label="Checking your account…" />
  );
}

function DashboardContent({
  groupId,
}: {
  groupId: string;
}) {
  const {
    firestore,
  } = useFirebase();

  const [
    selectedDate,
    setSelectedDate,
  ] = useState<Date>(
    new Date()
  );

  const [
    currentMonth,
    setCurrentMonth,
  ] = useState<Date>(
    startOfMonth(
      new Date()
    )
  );

  const groupRef =
    useMemo(() => {
      return doc(
        firestore,
        "groups",
        groupId
      );
    }, [
      firestore,
      groupId,
    ]);

  const {
    data: groupData,
    isLoading:
    isGroupLoading,
    error:
    groupError,
  } =
    useDoc<GroupRecord>(
      groupRef
    );

  const monthDateRange =
    useMemo(() => {
      return {
        start:
          startOfMonth(
            currentMonth
          ),

        end:
          endOfMonth(
            currentMonth
          ),
      };
    }, [currentMonth]);

  const expensesQuery =
    useMemo(() => {
      return query(
        collection(
          firestore,
          "groups",
          groupId,
          "expenses"
        ),

        where(
          "date",
          ">=",
          Timestamp.fromDate(
            monthDateRange.start
          )
        ),

        where(
          "date",
          "<=",
          Timestamp.fromDate(
            monthDateRange.end
          )
        ),

        orderBy(
          "date",
          "desc"
        )
      );
    }, [
      firestore,
      groupId,
      monthDateRange,
    ]);

  const {
    data: expenses,
    isLoading:
    areExpensesLoading,
    error:
    expensesError,
  } =
    useCollection<Expense>(
      expensesQuery
    );

  const handleMonthChange = (
    direction:
      | "next"
      | "prev"
  ) => {
    setCurrentMonth(
      (
        previousMonth
      ) => {
        if (
          direction ===
          "next"
        ) {
          return addMonths(
            previousMonth,
            1
          );
        }

        return subMonths(
          previousMonth,
          1
        );
      }
    );
  };

  if (isGroupLoading) {
    return (
      <AppBrandLoader label="Preparing your dashboard…" />
    );
  }

  if (
    groupError ||
    expensesError
  ) {
    return (
      <Alert variant="destructive">
        <AlertTitle>
          Dashboard could not be loaded
        </AlertTitle>

        <AlertDescription>
          {getErrorMessage(
            groupError ||
            expensesError
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!groupData) {
    return (
      <Alert variant="destructive">
        <AlertTitle>
          Group not found
        </AlertTitle>

        <AlertDescription>
          Your account contains a group reference, but that group could not be found. Please contact the group administrator.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 font-headline text-2xl font-semibold tracking-tight md:text-3xl">
          <span className="bb-page-title-icon">
            <LayoutDashboard className="h-5 w-5" />
          </span>
          Dashboard
        </h1>

        <p className="text-sm text-muted-foreground">
          Log your meals and expenses for the day.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <DateCard
            date={
              selectedDate
            }
            setDate={
              setSelectedDate
            }
          />

          <AwayToggleCard groupId={groupId} />

          <LogMealCard
            selectedDate={
              selectedDate
            }
          />

          <AddExpenseCard
            selectedDate={
              selectedDate
            }
          />

          <SendReminderCard />
        </div>

        <div className="lg:col-span-3">
          <ActivityFeed
            expenses={
              expenses ?? []
            }
            isLoading={
              areExpensesLoading
            }
            currentMonth={
              currentMonth
            }
            onMonthChange={
              handleMonthChange
            }
          />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router =
    useRouter();

  const {
    firestore,
  } = useFirebase();

  const {
    user: currentUser,
    isUserLoading,
  } = useUser();

  /*
   * Authentication resolve হওয়ার পর user না থাকলে
   * সরাসরি login page-এ পাঠাবে।
   */
  useEffect(() => {
    if (
      !isUserLoading &&
      !currentUser
    ) {
      router.replace(
        "/login"
      );
    }
  }, [
    currentUser,
    isUserLoading,
    router,
  ]);

  const currentUserRef =
    useMemo(() => {
      if (!currentUser) {
        return null;
      }

      return doc(
        firestore,
        "users",
        currentUser.uid
      );
    }, [
      firestore,
      currentUser,
    ]);

  const {
    data: currentUserData,
    isLoading:
    isCurrentUserDataLoading,
    error:
    currentUserDataError,
  } =
    useDoc<UserProfileRecord>(
      currentUserRef
    );

  /*
   * Firebase Auth এখনও resolve হয়নি।
   */
  if (isUserLoading) {
    return (
      <AppBrandLoader label="Preparing your dashboard…" />
    );
  }

  /*
   * User logout অবস্থায় Dashboard/Header render না করে
   * login redirect শেষ হওয়ার অপেক্ষা করবে।
   */
  if (!currentUser) {
    return (
      <AuthenticationRedirect />
    );
  }

  if (
    isCurrentUserDataLoading
  ) {
    return (
      <AppBrandLoader label="Preparing your dashboard…" />
    );
  }

  if (currentUserDataError) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />

        <main className="container mx-auto flex-grow px-4 py-8 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertTitle>
              User profile could not be loaded
            </AlertTitle>

            <AlertDescription>
              {getErrorMessage(
                currentUserDataError
              )}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  const groupId =
    currentUserData?.groupId;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <UserManualReminder
        userId={currentUser.uid}
        onboardingComplete={
          Boolean(currentUserData?.onboardingCompletedAt) ||
          (currentUserData?.onboardingVersion ?? 0) >= 1
        }
        hasSeenReminder={Boolean(currentUserData?.userManualReminderSeenAt)}
      />

      <main className="container mx-auto flex-grow px-4 py-8 sm:px-6 lg:px-8">
        {groupId ? (
          <DashboardContent
            groupId={
              groupId
            }
          />
        ) : (
          <Welcome />
        )}
      </main>
    </div>
  );
}
