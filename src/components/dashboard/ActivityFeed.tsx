"use client";

import {
    memo,
    useMemo,
} from "react";
import dynamic from "next/dynamic";
import { format } from "date-fns/format";
import {
    Flame,
    Wifi,
    List,
    Receipt,
    ShoppingCart,
    Zap,
} from "lucide-react";
import {
    Timestamp,
} from "firebase/firestore";

import type {
    Expense,
    ExpenseCategory,
} from "@/lib/types";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthSwitcher } from "@/components/report/month-switcher";

const ExpenseDetailsDialog = dynamic(
    () =>
        import("./ExpenseDetailsDialog").then(
            (module) => module.ExpenseDetailsDialog
        ),
    {
        ssr: false,
        loading: () => <Skeleton className="h-7 w-16" />,
    }
);

interface ActivityFeedProps {
    expenses: Expense[];
    isLoading: boolean;
    currentMonth: Date;
    onMonthChange: (direction: "next" | "prev") => void;
}

const categoryIcons: Record<
    ExpenseCategory,
    React.ReactNode
> = {
    "Food & Groceries": <ShoppingCart className="h-3 w-3" />,
    Electricity: <Zap className="h-3 w-3" />,
    Gas: <Flame className="h-3 w-3" />,
    "Wi-Fi": <Wifi className="h-3 w-3" />,
    Other: <List className="h-3 w-3" />,
};

const CategoryBadge = memo(
    ({ category }: { category: ExpenseCategory }) => {
        return (
            <Badge
                variant="outline"
                className="inline-flex items-center justify-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium"
            >
                {categoryIcons[category]}
                <span>{category}</span>
            </Badge>
        );
    }
);

CategoryBadge.displayName = "CategoryBadge";

function getExpenseDate(expense: Expense): Date {
    if (expense.date instanceof Timestamp) {
        return expense.date.toDate();
    }

    return expense.date;
}

export function ActivityFeed({
    expenses,
    isLoading,
    currentMonth,
    onMonthChange,
}: ActivityFeedProps) {
    const sortedExpenses = useMemo(() => {
        return [...(expenses || [])].sort((firstExpense, secondExpense) => {
            return (
                getExpenseDate(secondExpense).getTime() -
                getExpenseDate(firstExpense).getTime()
            );
        });
    }, [expenses]);

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                        <CardTitle>Monthly Expense Feed</CardTitle>
                        <CardDescription>
                            Showing all expenses for {format(currentMonth, "MMMM yyyy")}.
                        </CardDescription>
                    </div>

                    <MonthSwitcher
                        currentDate={currentMonth}
                        onMonthChange={onMonthChange}
                    />
                </div>
            </CardHeader>

            <CardContent>
                <ScrollArea className="h-[calc(100vh-235px)] min-h-[420px] max-h-[720px] pr-3">
                    {isLoading ? (
                        <div className="space-y-1">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 border-b py-3 last:border-b-0"
                                >
                                    <Skeleton className="h-10 w-10 rounded-xl" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-3.5 w-28" />
                                        <Skeleton className="h-3 w-44" />
                                    </div>
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    ) : sortedExpenses.length > 0 ? (
                        <div>
                            {sortedExpenses.map((expense) => {
                                const expenseDate = getExpenseDate(expense);

                                return (
                                    <article
                                        key={`expense-${expense.id}`}
                                        className="flex items-start justify-between gap-4 border-b border-border/75 py-3 last:border-b-0"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                <p className="truncate text-[14px] font-semibold text-foreground">
                                                    {expense.userName || "Member"}
                                                </p>

                                                <span className="text-[11px] text-muted-foreground">
                                                    {format(expenseDate, "MMM d")}
                                                </span>
                                            </div>

                                            <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-muted-foreground">
                                                {expense.expenseItem}
                                            </p>

                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <CategoryBadge category={expense.category} />
                                                <ExpenseDetailsDialog item={expense} />
                                            </div>
                                        </div>

                                        <div className="shrink-0 pt-0.5 text-right">
                                            <p className="text-[15px] font-bold tabular-nums text-foreground">
                                                ৳{expense.amount.toFixed(2)}
                                            </p>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex h-full min-h-[360px] flex-col items-center justify-center py-16 text-center text-muted-foreground">
                            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                                <Receipt className="h-6 w-6" />
                            </span>
                            <p className="text-sm font-medium">
                                No expenses logged for this month.
                            </p>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
