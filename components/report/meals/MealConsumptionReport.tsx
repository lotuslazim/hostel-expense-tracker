"use client";

import {
    useMemo,
    useState,
} from "react";
import {
    collection,
    doc,
    query,
    Timestamp,
    where,
} from "firebase/firestore";
import {
    addMonths,
    endOfMonth,
    format,
    startOfMonth,
    subMonths,
} from "date-fns";
import {
    AlertCircle,
    ChevronDown,
    LeafyGreen,
    ShoppingCart,
    Utensils,
} from "lucide-react";

import {
    useCollection,
    useDoc,
    useFirebase,
    useUser,
} from "@/firebase";
import type { MealLog } from "@/lib/types";

import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { MonthSwitcher } from "../month-switcher";

type UserProfile = {
    displayName?: string;
    photoURL?: string;
    email?: string;
    groupId?: string | null;
};

type PurchaseRecord = {
    id: string;
    itemId?: string;
    itemName: string;
    quantity: number;
    cost: number;
    unit: string;
    unitPrice?: number;
    date: Date | Timestamp;
    userId: string;
    userName?: string;
    groupId: string;
};

type DailyMealActivity = {
    dateKey: string;
    date: Date;
    meals: MealLog[];
};

type MemberActivity = {
    id: string;
    displayName: string;
    photoURL?: string;
    totalMealCount: number;
    totalFoodExpenses: number;
    dailyMeals: DailyMealActivity[];
    monthlyPurchases: PurchaseRecord[];
};

const toDate = (
    value:
        | Date
        | Timestamp
        | null
        | undefined
): Date | null => {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return value;
    }

    if (
        typeof value.toDate ===
        "function"
    ) {
        return value.toDate();
    }

    return null;
};

const getTime = (
    value:
        | Date
        | Timestamp
        | null
        | undefined
): number => {
    const date = toDate(value);

    return date
        ? date.getTime()
        : 0;
};

function ReportSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-4 w-80 max-w-full" />
                </div>

                <Skeleton className="h-10 w-64 max-w-full" />
            </div>

            <div className="space-y-4">
                {Array.from({
                    length: 3,
                }).map((_, index) => (
                    <Card key={index}>
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />

                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-6 w-36" />
                                    <Skeleton className="h-4 w-56 max-w-full" />
                                </div>

                                <Skeleton className="hidden h-10 w-40 md:block" />
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export function MealConsumptionReport() {
    const {
        firestore,
    } = useFirebase();

    const {
        user: currentUser,
        isUserLoading,
    } = useUser();

    const [
        currentMonth,
        setCurrentMonth,
    ] = useState(() =>
        startOfMonth(new Date())
    );

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
            currentUser,
            firestore,
        ]);

    const {
        data: currentUserData,
        isLoading:
        isCurrentUserDataLoading,
        error:
        currentUserDataError,
    } = useDoc<UserProfile>(
        currentUserRef
    );

    const groupId =
        currentUserData?.groupId;

    const monthRange =
        useMemo(() => {
            return {
                start:
                    Timestamp.fromDate(
                        startOfMonth(
                            currentMonth
                        )
                    ),

                end:
                    Timestamp.fromDate(
                        endOfMonth(
                            currentMonth
                        )
                    ),
            };
        }, [currentMonth]);

    const mealsQuery =
        useMemo(() => {
            if (!groupId) {
                return null;
            }

            return query(
                collection(
                    firestore,
                    "groups",
                    groupId,
                    "meals"
                ),
                where(
                    "date",
                    ">=",
                    monthRange.start
                ),
                where(
                    "date",
                    "<=",
                    monthRange.end
                )
            );
        }, [
            firestore,
            groupId,
            monthRange,
        ]);

    const purchasesQuery =
        useMemo(() => {
            if (!groupId) {
                return null;
            }

            return query(
                collection(
                    firestore,
                    "groups",
                    groupId,
                    "purchases"
                ),
                where(
                    "date",
                    ">=",
                    monthRange.start
                ),
                where(
                    "date",
                    "<=",
                    monthRange.end
                )
            );
        }, [
            firestore,
            groupId,
            monthRange,
        ]);

    const {
        data: meals,
        isLoading:
        areMealsLoading,
        error: mealsError,
    } = useCollection<MealLog>(
        mealsQuery
    );

    const {
        data: purchases,
        isLoading:
        arePurchasesLoading,
        error:
        purchasesError,
    } =
        useCollection<PurchaseRecord>(
            purchasesQuery
        );

    const handleMonthChange = (
        direction:
            | "next"
            | "prev"
    ) => {
        setCurrentMonth(
            (previousMonth) => {
                return direction ===
                    "next"
                    ? addMonths(
                        previousMonth,
                        1
                    )
                    : subMonths(
                        previousMonth,
                        1
                    );
            }
        );
    };

    const activitiesByMember =
        useMemo(() => {
            const mealRecords =
                meals ?? [];

            const purchaseRecords =
                purchases ?? [];

            const memberIds =
                new Set<string>();

            const namesByUserId =
                new Map<
                    string,
                    string
                >();

            mealRecords.forEach(
                (meal) => {
                    if (!meal.userId) {
                        return;
                    }

                    memberIds.add(
                        meal.userId
                    );

                    if (
                        meal.userName
                    ) {
                        namesByUserId.set(
                            meal.userId,
                            meal.userName
                        );
                    }
                }
            );

            purchaseRecords.forEach(
                (purchase) => {
                    if (
                        !purchase.userId
                    ) {
                        return;
                    }

                    memberIds.add(
                        purchase.userId
                    );

                    if (
                        purchase.userName
                    ) {
                        namesByUserId.set(
                            purchase.userId,
                            purchase.userName
                        );
                    }
                }
            );

            if (
                currentUser
            ) {
                const currentUserName =
                    currentUserData?.displayName ||
                    currentUser.displayName ||
                    currentUser.email?.split(
                        "@"
                    )[0];

                if (
                    currentUserName
                ) {
                    namesByUserId.set(
                        currentUser.uid,
                        currentUserName
                    );
                }
            }

            return Array.from(
                memberIds
            )
                .map(
                    (
                        memberId
                    ): MemberActivity => {
                        const memberMeals =
                            mealRecords.filter(
                                (meal) =>
                                    meal.userId ===
                                    memberId
                            );

                        const memberPurchases =
                            purchaseRecords
                                .filter(
                                    (purchase) =>
                                        purchase.userId ===
                                        memberId &&
                                        Number(
                                            purchase.cost
                                        ) > 0
                                )
                                .sort(
                                    (
                                        firstPurchase,
                                        secondPurchase
                                    ) => {
                                        return (
                                            getTime(
                                                secondPurchase.date
                                            ) -
                                            getTime(
                                                firstPurchase.date
                                            )
                                        );
                                    }
                                );

                        const totalMealCount =
                            memberMeals.reduce(
                                (
                                    total,
                                    meal
                                ) => {
                                    return (
                                        total +
                                        Number(
                                            meal.mealNumber ||
                                            0
                                        )
                                    );
                                },
                                0
                            );

                        const totalFoodExpenses =
                            memberPurchases.reduce(
                                (
                                    total,
                                    purchase
                                ) => {
                                    return (
                                        total +
                                        Number(
                                            purchase.cost ||
                                            0
                                        )
                                    );
                                },
                                0
                            );

                        const groupedMeals =
                            memberMeals.reduce<
                                Record<
                                    string,
                                    DailyMealActivity
                                >
                            >(
                                (
                                    grouped,
                                    meal
                                ) => {
                                    const mealDate =
                                        toDate(
                                            meal.date
                                        );

                                    if (!mealDate) {
                                        return grouped;
                                    }

                                    const dateKey =
                                        format(
                                            mealDate,
                                            "yyyy-MM-dd"
                                        );

                                    if (
                                        !grouped[
                                        dateKey
                                        ]
                                    ) {
                                        grouped[
                                            dateKey
                                        ] = {
                                            dateKey,
                                            date:
                                                mealDate,
                                            meals: [],
                                        };
                                    }

                                    grouped[
                                        dateKey
                                    ].meals.push(
                                        meal
                                    );

                                    return grouped;
                                },
                                {}
                            );

                        const dailyMeals =
                            Object.values(
                                groupedMeals
                            ).sort(
                                (
                                    firstDay,
                                    secondDay
                                ) => {
                                    return (
                                        secondDay.date.getTime() -
                                        firstDay.date.getTime()
                                    );
                                }
                            );

                        const displayName =
                            namesByUserId.get(
                                memberId
                            ) ||
                            `Member ${memberId.slice(
                                0,
                                5
                            )}`;

                        const photoURL =
                            memberId ===
                                currentUser?.uid
                                ? currentUserData?.photoURL ||
                                currentUser.photoURL ||
                                undefined
                                : undefined;

                        return {
                            id:
                                memberId,
                            displayName,
                            photoURL,
                            totalMealCount,
                            totalFoodExpenses,
                            dailyMeals,
                            monthlyPurchases:
                                memberPurchases,
                        };
                    }
                )
                .sort(
                    (
                        firstMember,
                        secondMember
                    ) => {
                        return firstMember.displayName.localeCompare(
                            secondMember.displayName
                        );
                    }
                );
        }, [
            currentUser,
            currentUserData,
            meals,
            purchases,
        ]);

    const isLoading =
        isUserLoading ||
        isCurrentUserDataLoading ||
        Boolean(
            groupId &&
            (areMealsLoading ||
                arePurchasesLoading)
        );

    const reportError =
        currentUserDataError ||
        mealsError ||
        purchasesError;

    if (isLoading) {
        return <ReportSkeleton />;
    }

    if (reportError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />

                <AlertTitle>
                    Meal report could not be loaded
                </AlertTitle>

                <AlertDescription>
                    {reportError.message ||
                        "Please check the Firestore permissions and refresh the page."}
                </AlertDescription>
            </Alert>
        );
    }

    if (!groupId) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <LeafyGreen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />

                    <h3 className="text-lg font-semibold">
                        No group found
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Join or create a group to view the meal report.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h2 className="font-headline text-xl font-bold md:text-2xl">
                        Monthly Meal Report
                    </h2>

                    <p className="text-sm text-muted-foreground">
                        Meal and food-purchase activity for the selected month.
                    </p>
                </div>

                <MonthSwitcher
                    currentDate={
                        currentMonth
                    }
                    onMonthChange={
                        handleMonthChange
                    }
                />
            </div>

            {activitiesByMember.length ===
                0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <LeafyGreen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />

                        <h3 className="text-lg font-semibold">
                            No meal activity
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                            No meal or food-purchase data was found for{" "}
                            {format(
                                currentMonth,
                                "MMMM yyyy"
                            )}
                            .
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {activitiesByMember.map(
                        (member) => (
                            <Card
                                key={member.id}
                                className="overflow-hidden border-[#5eead4]/15 bg-[linear-gradient(155deg,rgba(21,55,46,0.98),rgba(13,39,35,0.98))]"
                            >
                                <Collapsible>
                                    <div className="flex flex-col items-start justify-between gap-3 p-3 md:flex-row md:items-center">
                                        <div className="flex min-w-0 flex-1 items-center gap-4">
                                            <Avatar className="h-10 w-10 shrink-0 border border-[#f4d35e]/45">
                                                {member.photoURL && (
                                                    <AvatarImage
                                                        src={
                                                            member.photoURL
                                                        }
                                                        alt={
                                                            member.displayName
                                                        }
                                                    />
                                                )}

                                                <AvatarFallback>
                                                    {member.displayName
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="min-w-0">
                                                <p className="truncate text-[14px] font-semibold text-[#f4f7f5]">
                                                    {member.displayName}
                                                </p>

                                                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#c8bfa8]">
                                                    <span>
                                                        Total Meals:{" "}
                                                        <span className="font-semibold text-[#f4d35e]">
                                                            {member.totalMealCount}
                                                        </span>
                                                    </span>

                                                    <span>
                                                        Food Expenses:{" "}
                                                        <span className="font-semibold text-[#ffd56a]">
                                                            ৳
                                                            {member.totalFoodExpenses.toLocaleString()}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <CollapsibleTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="h-9 w-full rounded-lg border border-[#5eead4]/14 bg-[#153a33] px-4 text-[12px] font-medium text-[#f1eee4] hover:bg-[#19463d] hover:text-white md:w-auto"
                                            >
                                                View Daily Activity

                                                <ChevronDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </CollapsibleTrigger>
                                    </div>

                                    <CollapsibleContent>
                                        <div className="space-y-4 border-t border-[#5eead4]/12 bg-[linear-gradient(145deg,rgba(17,54,47,0.98),rgba(12,40,48,0.98))] p-3">
                                            <div>
                                                <h3 className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[#f1f7f4]">
                                                    <Utensils className="h-5 w-5" />
                                                    Daily Meal Log
                                                </h3>

                                                {member.dailyMeals.length >
                                                    0 ? (
                                                    <div className="space-y-3">
                                                        {member.dailyMeals.map(
                                                            (day) => (
                                                                <div
                                                                    key={
                                                                        day.dateKey
                                                                    }
                                                                    className="rounded-xl border border-[#5eead4]/14 bg-[#0c2b2b]/78 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]"
                                                                >
                                                                    <h4 className="mb-2 text-[12px] font-semibold text-[#e8c979]">
                                                                        {format(
                                                                            day.date,
                                                                            "MMMM d, yyyy"
                                                                        )}
                                                                    </h4>

                                                                    <div className="space-y-2 text-[12px] text-[#e8f1ee]">
                                                                        {day.meals.map(
                                                                            (meal) => (
                                                                                <div
                                                                                    key={
                                                                                        meal.id
                                                                                    }
                                                                                    className="flex items-center justify-between gap-3"
                                                                                >
                                                                                    <div className="flex min-w-0 items-center gap-2">
                                                                                        <Badge
                                                                                            variant="secondary"
                                                                                            className="w-24 shrink-0 justify-center border border-[#6ee7b7]/20 bg-[#6ee7b7]/12 text-[10px] font-medium capitalize text-[#f1eee4] hover:bg-[#6ee7b7]/12"
                                                                                        >
                                                                                            {meal.mealType}
                                                                                        </Badge>

                                                                                        <span className="truncate">
                                                                                            {meal.itemName ||
                                                                                                meal.description ||
                                                                                                "Meal"}
                                                                                        </span>
                                                                                    </div>

                                                                                    <span className="shrink-0 font-semibold text-[#f4d35e]">
                                                                                        ×{" "}
                                                                                        {meal.mealNumber}
                                                                                    </span>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="py-5 text-center text-sm text-muted-foreground">
                                                        No meals logged by {member.displayName} this month.
                                                    </p>
                                                )}
                                            </div>

                                            <Separator className="bg-[#5eead4]/12" />

                                            <div>
                                                <h3 className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[#f1f7f4]">
                                                    <ShoppingCart className="h-5 w-5" />
                                                    Monthly Food Purchases
                                                </h3>

                                                {member.monthlyPurchases.length >
                                                    0 ? (
                                                    <div className="overflow-x-auto rounded-xl border border-[#5eead4]/12 bg-[#0b292a]/68">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>
                                                                        Date
                                                                    </TableHead>

                                                                    <TableHead>
                                                                        Item
                                                                    </TableHead>

                                                                    <TableHead>
                                                                        Quantity
                                                                    </TableHead>

                                                                    <TableHead className="text-right">
                                                                        Cost
                                                                    </TableHead>
                                                                </TableRow>
                                                            </TableHeader>

                                                            <TableBody>
                                                                {member.monthlyPurchases.map(
                                                                    (purchase) => {
                                                                        const purchaseDate =
                                                                            toDate(
                                                                                purchase.date
                                                                            );

                                                                        return (
                                                                            <TableRow
                                                                                key={
                                                                                    purchase.id
                                                                                }
                                                                            >
                                                                                <TableCell>
                                                                                    {purchaseDate
                                                                                        ? format(
                                                                                            purchaseDate,
                                                                                            "MMM dd"
                                                                                        )
                                                                                        : "—"}
                                                                                </TableCell>

                                                                                <TableCell className="font-medium">
                                                                                    {purchase.itemName}
                                                                                </TableCell>

                                                                                <TableCell>
                                                                                    {purchase.quantity}{" "}
                                                                                    {purchase.unit}
                                                                                </TableCell>

                                                                                <TableCell className="text-right">
                                                                                    ৳
                                                                                    {Number(
                                                                                        purchase.cost ||
                                                                                        0
                                                                                    ).toLocaleString()}
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        );
                                                                    }
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                ) : (
                                                    <p className="py-5 text-center text-sm text-muted-foreground">
                                                        No food purchases recorded by {member.displayName} this month.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </Card>
                        )
                    )}
                </div>
            )}
        </div>
    );
}