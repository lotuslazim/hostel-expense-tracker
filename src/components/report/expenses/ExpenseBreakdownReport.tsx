"use client";

import {
    type ReactNode,
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
    Eye,
    Flame,
    Wifi,
    List,
    PackageOpen,
    ReceiptText,
    ShoppingCart,
    Wallet,
    Zap,
} from "lucide-react";

import {
    useCollection,
    useDoc,
    useFirebase,
    useUser,
} from "@/firebase";

import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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

type ReportExpenseCategory =
    | "Food & Groceries"
    | "Electricity"
    | "Gas"
    | "Wi-Fi"
    | "Other";

type UserProfile = {
    displayName?: string;
    email?: string;
    photoURL?: string;
    groupId?: string | null;
};

type PurchasedItemRecord = {
    name?: string;
    quantity?: number;
    unit?: string;
    cost?: number;
    itemId?: string;
    shoppingItemId?: string;
};

type ExpenseRecord = {
    id: string;
    description?: string;
    expenseItem?: string;
    amount?: number;
    category?: string;
    quantity?: number;
    date?: Date | Timestamp;
    receiptPhotoUrl?: string;
    userId?: string;
    groupId?: string;
    userName?: string;
    purchasedItems?: PurchasedItemRecord[];
};

const categoryIcons: Record<
    ReportExpenseCategory,
    ReactNode
> = {
    "Food & Groceries": (
        <ShoppingCart className="h-3.5 w-3.5" />
    ),

    Electricity: (
        <Zap className="h-3.5 w-3.5" />
    ),

    Gas: (
        <Flame className="h-3.5 w-3.5" />
    ),

    "Wi-Fi": (
        <Wifi className="h-3.5 w-3.5" />
    ),

    Other: (
        <List className="h-3.5 w-3.5" />
    ),
};

const normalizeCategory = (
    category?: string
): ReportExpenseCategory => {
    switch (category) {
        case "Food & Groceries":
        case "Electricity":
        case "Gas":
        case "Wi-Fi":
        case "Other":
            return category;

        default:
            return "Other";
    }
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
    return (
        toDate(value)?.getTime() ??
        0
    );
};

const formatMoney = (
    value: number | null | undefined
): string => {
    const amount = Number(
        value ?? 0
    );

    if (!Number.isFinite(amount)) {
        return "0";
    }

    return Math.round(
        amount
    ).toLocaleString();
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

    return "Please check Firestore permissions and refresh the page.";
};

function CategoryBadge({
    category,
}: {
    category?: string;
}) {
    const normalizedCategory =
        normalizeCategory(category);

    const categoryLabel =
        category?.trim() ||
        normalizedCategory;

    return (
        <Badge
            variant="outline"
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap px-2 py-1"
        >
            {
                categoryIcons[
                normalizedCategory
                ]
            }

            <span>
                {categoryLabel}
            </span>
        </Badge>
    );
}

function ExpenseDetailsDialog({
    expense,
}: {
    expense: ExpenseRecord;
}) {
    const expenseDate = toDate(
        expense.date
    );

    const purchasedItems =
        expense.purchasedItems ?? [];

    const hasPurchasedItems =
        normalizeCategory(
            expense.category
        ) ===
        "Food & Groceries" &&
        purchasedItems.length > 0;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-2 text-xs"
                >
                    <Eye className="h-3.5 w-3.5" />
                    Details
                </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Expense Details
                    </DialogTitle>

                    <DialogDescription>
                        Logged by{" "}
                        {expense.userName ||
                            "Group Member"}
                        {expenseDate
                            ? ` on ${format(
                                expenseDate,
                                "MMM d, yyyy"
                            )}`
                            : ""}
                        .
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Item
                            </p>

                            <p className="mt-1 font-semibold">
                                {expense.expenseItem ||
                                    expense.description ||
                                    "Expense"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Category
                            </p>

                            <div className="mt-1">
                                <CategoryBadge
                                    category={
                                        expense.category
                                    }
                                />
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Amount
                            </p>

                            <p className="mt-1 text-lg font-bold">
                                ৳
                                {formatMoney(
                                    expense.amount
                                )}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Member
                            </p>

                            <p className="mt-1 font-medium">
                                {expense.userName ||
                                    "Group Member"}
                            </p>
                        </div>
                    </div>

                    {hasPurchasedItems && (
                        <div>
                            <h3 className="mb-3 font-semibold">
                                Purchased Items
                            </h3>

                            <div className="overflow-x-auto rounded-xl border">
                                <Table className="min-w-[520px]">
                                    <TableHeader>
                                        <TableRow>
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
                                        {purchasedItems.map(
                                            (
                                                purchasedItem,
                                                index
                                            ) => (
                                                <TableRow
                                                    key={`${purchasedItem.name || "item"}-${index}`}
                                                >
                                                    <TableCell className="font-medium">
                                                        {purchasedItem.name ||
                                                            "Item"}
                                                    </TableCell>

                                                    <TableCell>
                                                        {Number(
                                                            purchasedItem.quantity ??
                                                            0
                                                        )}{" "}
                                                        {purchasedItem.unit ||
                                                            ""}
                                                    </TableCell>

                                                    <TableCell className="text-right font-semibold">
                                                        ৳
                                                        {formatMoney(
                                                            purchasedItem.cost
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {expense.receiptPhotoUrl && (
                        <div className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-medium">
                                    Receipt
                                </p>

                                <p className="text-sm text-muted-foreground">
                                    Open the uploaded receipt image in a new tab.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                asChild
                            >
                                <a
                                    href={
                                        expense.receiptPhotoUrl
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View Receipt
                                </a>
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

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

            <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
            </div>

            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="mt-2 h-4 w-72 max-w-full" />
                </CardHeader>

                <CardContent>
                    <div className="space-y-3">
                        {Array.from({
                            length: 5,
                        }).map((_, index) => (
                            <Skeleton
                                key={index}
                                className="h-14 w-full"
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function ExpenseBreakdownReport() {
    const { firestore } =
        useFirebase();

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

    const expensesQuery =
        useMemo(() => {
            if (!groupId) {
                return null;
            }

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
        data: expenses,
        isLoading:
        areExpensesLoading,
        error:
        expensesError,
    } = useCollection<ExpenseRecord>(
        expensesQuery
    );

    const sortedExpenses =
        useMemo(() => {
            return [
                ...(expenses ?? []),
            ].sort(
                (
                    firstExpense,
                    secondExpense
                ) => {
                    return (
                        getTime(
                            secondExpense.date
                        ) -
                        getTime(
                            firstExpense.date
                        )
                    );
                }
            );
        }, [expenses]);

    const totalExpense =
        useMemo(() => {
            return sortedExpenses.reduce(
                (
                    total,
                    expense
                ) => {
                    const amount = Number(
                        expense.amount ?? 0
                    );

                    return Number.isFinite(
                        amount
                    )
                        ? total + amount
                        : total;
                },
                0
            );
        }, [sortedExpenses]);

    const uniqueMemberCount =
        useMemo(() => {
            return new Set(
                sortedExpenses
                    .map(
                        (expense) =>
                            expense.userId
                    )
                    .filter(Boolean)
            ).size;
        }, [sortedExpenses]);

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

    const isLoading =
        isUserLoading ||
        isCurrentUserDataLoading ||
        Boolean(
            groupId &&
            areExpensesLoading
        );

    const reportError =
        currentUserDataError ||
        expensesError;

    if (isLoading) {
        return <ReportSkeleton />;
    }

    if (reportError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />

                <AlertTitle>
                    Expense report could not be loaded
                </AlertTitle>

                <AlertDescription>
                    {getErrorMessage(
                        reportError
                    )}
                </AlertDescription>
            </Alert>
        );
    }

    if (!groupId) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Wallet className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />

                    <h3 className="text-lg font-semibold">
                        No group found
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Join or create a group to view expense reports.
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
                        Monthly Expense Report
                    </h2>

                    <p className="text-sm text-muted-foreground">
                        A complete breakdown of group expenses for the selected month.
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

            <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Wallet className="h-5 w-5" />
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                Total Expenses
                            </p>

                            <p className="text-2xl font-bold">
                                ৳
                                {formatMoney(
                                    totalExpense
                                )}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <ReceiptText className="h-5 w-5" />
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                Records & Members
                            </p>

                            <p className="text-lg font-bold">
                                {sortedExpenses.length}{" "}
                                expenses
                            </p>

                            <p className="text-xs text-muted-foreground">
                                {uniqueMemberCount}{" "}
                                member
                                {uniqueMemberCount ===
                                    1
                                    ? ""
                                    : "s"}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        All Expenses
                    </CardTitle>

                    <CardDescription>
                        Showing all expenses logged for{" "}
                        {format(
                            currentMonth,
                            "MMMM yyyy"
                        )}
                        .
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {sortedExpenses.length >
                        0 ? (
                        <div className="overflow-x-auto">
                            <Table className="min-w-[760px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            Date
                                        </TableHead>

                                        <TableHead>
                                            Member
                                        </TableHead>

                                        <TableHead>
                                            Item
                                        </TableHead>

                                        <TableHead>
                                            Category
                                        </TableHead>

                                        <TableHead className="text-right">
                                            Amount
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {sortedExpenses.map(
                                        (expense) => {
                                            const expenseDate =
                                                toDate(
                                                    expense.date
                                                );

                                            const expenseName =
                                                expense.expenseItem ||
                                                expense.description ||
                                                "Expense";

                                            return (
                                                <TableRow
                                                    key={
                                                        expense.id
                                                    }
                                                >
                                                    <TableCell className="whitespace-nowrap">
                                                        {expenseDate
                                                            ? format(
                                                                expenseDate,
                                                                "MMM dd, yyyy"
                                                            )
                                                            : "—"}
                                                    </TableCell>

                                                    <TableCell>
                                                        {expense.userName ||
                                                            "Group Member"}
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="flex min-w-[200px] items-center justify-between gap-3">
                                                            <span className="line-clamp-2">
                                                                {expenseName}
                                                            </span>

                                                            <ExpenseDetailsDialog
                                                                expense={
                                                                    expense
                                                                }
                                                            />
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <CategoryBadge
                                                            category={
                                                                expense.category
                                                            }
                                                        />
                                                    </TableCell>

                                                    <TableCell className="whitespace-nowrap text-right font-semibold">
                                                        ৳
                                                        {formatMoney(
                                                            expense.amount
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        }
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                            <PackageOpen className="mb-4 h-10 w-10" />

                            <h3 className="text-lg font-semibold text-foreground">
                                No Expenses Logged
                            </h3>

                            <p className="mt-1">
                                No expenses were found for{" "}
                                {format(
                                    currentMonth,
                                    "MMMM yyyy"
                                )}
                                .
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
