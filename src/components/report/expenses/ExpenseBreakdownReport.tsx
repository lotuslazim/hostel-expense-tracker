
"use client";

import { useMemo, useState } from "react";
import { useUser, useDoc, useCollection, useFirebase } from "@/firebase";
import { doc, collection, query, where, Timestamp, orderBy } from "firebase/firestore";
import { format } from 'date-fns/format';
import { startOfMonth } from 'date-fns/startOfMonth';
import { endOfMonth } from 'date-fns/endOfMonth';
import { addMonths } from 'date-fns/addMonths';
import { subMonths } from 'date-fns/subMonths';
import type { Expense, ExpenseCategory } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthSwitcher } from "../month-switcher";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Zap, Flame, List, PackageOpen } from "lucide-react";
import { ExpenseDetailsDialog } from "@/components/dashboard/ExpenseDetailsDialog";

function ReportSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><Skeleton className="h-5 w-24"/></TableHead>
                            <TableHead><Skeleton className="h-5 w-32"/></TableHead>
                            <TableHead><Skeleton className="h-5 w-48"/></TableHead>
                            <TableHead><Skeleton className="h-5 w-28"/></TableHead>
                            <TableHead className="text-right"><Skeleton className="h-5 w-20"/></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(5)].map((_, i) => (
                           <TableRow key={i}>
                               <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                               <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                               <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                               <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                               <TableCell className="text-right"><Skeleton className="h-5 w-20" /></TableCell>
                           </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

const categoryIcons: Record<ExpenseCategory, React.ReactNode> = {
    "Food & Groceries": <ShoppingCart className="h-3 w-3" />,
    "Electricity": <Zap className="h-3 w-3" />,
    "Gas": <Flame className="h-3 w-3" />,
    "Other": <List className="h-3 w-3" />,
};

const CategoryBadge = ({ category }: { category: ExpenseCategory }) => {
    return (
        <Badge variant="outline" className="inline-flex items-center justify-center gap-1.5 py-1 px-2">
            {categoryIcons[category]}
            <span>{category}</span>
        </Badge>
    )
};


export function ExpenseBreakdownReport() {
    const { firestore } = useFirebase();
    const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

    const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);

    const groupId = currentUserData?.groupId;

    const monthDateRange = useMemo(() => {
        return {
            start: Timestamp.fromDate(startOfMonth(currentMonth)),
            end: Timestamp.fromDate(endOfMonth(currentMonth)),
        };
    }, [currentMonth]);
    
    const expensesQuery = useMemo(() => 
        (groupId ? query(
            collection(firestore, `groups/${groupId}/expenses`),
            where("date", ">=", monthDateRange.start),
            where("date", "<=", monthDateRange.end),
            orderBy("date", "desc")
        ) : null), 
        [firestore, groupId, monthDateRange]
    );

    const { data: expenses, isLoading: areExpensesLoading } = useCollection<Expense>(expensesQuery);

    const handleMonthChange = (direction: "next" | "prev") => {
        setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
    }
    
    const isLoading = isCurrentUserLoading || isCurrentUserDataLoading || areExpensesLoading;

    if (isLoading) {
        return <ReportSkeleton />
    }

    return (
        <div className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                    <h2 className="text-xl md:text-2xl font-bold font-headline">Monthly Expense Report</h2>
                    <p className="text-sm text-muted-foreground">A complete breakdown of all group expenses for the selected month.</p>
                </div>
                <MonthSwitcher currentDate={currentMonth} onMonthChange={handleMonthChange} />
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>All Expenses</CardTitle>
                    <CardDescription>
                        Showing all expenses logged for {format(currentMonth, "MMMM yyyy")}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {expenses && expenses.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.map(expense => (
                                    <TableRow key={expense.id}>
                                        <TableCell>{format(expense.date.toDate(), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell>{expense.userName}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span>{expense.expenseItem}</span>
                                                <ExpenseDetailsDialog item={expense} />
                                            </div>
                                        </TableCell>
                                        <TableCell><CategoryBadge category={expense.category} /></TableCell>
                                        <TableCell className="text-right font-medium">৳{expense.amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <div className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center">
                            <PackageOpen className="h-10 w-10 mb-4" />
                            <h3 className="text-lg font-semibold">No Expenses Logged</h3>
                            <p>No expenses were found for {format(currentMonth, "MMMM yyyy")}.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
