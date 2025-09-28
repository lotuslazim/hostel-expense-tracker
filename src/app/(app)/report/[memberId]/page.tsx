
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { notFound, useSearchParams } from "next/navigation";
import { eachDayOfInterval, startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import { ArrowLeft, Utensils, Zap, Flame, Scale, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { useMemo } from "react";
import type { Meal, Expense } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import type { Timestamp } from "firebase/firestore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function ReportSkeleton() {
  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div>
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-6 w-56" /></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-20 w-full" />
            </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle><Skeleton className="h-6 w-40" /></CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-96 w-full" />
                </CardContent>
            </Card>
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle><Skeleton className="h-6 w-32" /></CardTitle></CardHeader>
                    <CardContent className="pt-6"><Skeleton className="h-24 w-full" /></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle><Skeleton className="h-6 w-40" /></CardTitle></CardHeader>
                    <CardContent className="space-y-3 pt-6">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}


function DataError() {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error Loading Report</AlertTitle>
      <AlertDescription>
        There was a problem fetching the data for this report. Please try again later.
      </AlertDescription>
    </Alert>
  )
}


export default function MemberReportPage({ params }: { params: { memberId: string } }) {
    const memberId = params.memberId;
    const searchParams = useSearchParams();
    const monthParam = searchParams.get('month');
    
    const { firestore } = useFirebase();
    const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();

    const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserData, isLoading: isCurrentUserDataLoading, error: currentUserDataError } = useDoc(currentUserRef);
    const groupId = currentUserData?.groupId;

    const targetDate = monthParam ? parseISO(monthParam) : new Date();

    const monthDateRange = useMemo(() => {
        return {
          start: startOfMonth(targetDate),
          end: endOfMonth(targetDate),
        };
    }, [targetDate]);

    // Queries
    const membersQuery = useMemo(() =>
        groupId ? collection(firestore, `groups/${groupId}/members`) : null,
        [firestore, groupId]
    );
    
    const mealsQuery = useMemo(() =>
        groupId ? query(
        collection(firestore, `groups/${groupId}/meals`),
        where("date", ">=", monthDateRange.start),
        where("date", "<=", monthDateRange.end)
        ) : null,
        [firestore, groupId, monthDateRange]
    );

    const expensesQuery = useMemo(() =>
        groupId ? query(
        collection(firestore, `groups/${groupId}/expenses`),
        where("date", ">=", monthDateRange.start),
        where("date", "<=", monthDateRange.end)
        ) : null,
        [firestore, groupId, monthDateRange]
    );

    const { data: membersData, isLoading: areMembersLoading, error: membersError } = useCollection(membersQuery);
    const { data: mealsData, isLoading: areMealsLoading, error: mealsError } = useCollection<Meal>(mealsQuery);
    const { data: expensesData, isLoading: areExpensesLoading, error: expensesError } = useCollection<Expense>(expensesQuery);

    
    const isLoading = isCurrentUserLoading || isCurrentUserDataLoading || areMembersLoading || areMealsLoading || areExpensesLoading;
    const hasError = currentUserDataError || membersError || mealsError || expensesError;
    
    const processedData = useMemo(() => {
        if (isLoading || hasError || !membersData || !mealsData || !expensesData) {
            return null;
        }

        const memberData = membersData.find(m => m.id === memberId);
        if (!memberData) return { notFound: true };

        const memberName = memberData.displayName || memberData.email.split('@')[0];

        const allMembersProcessed = membersData.map(member => {
            const memberMeals = mealsData.filter(m => m.userId === member.id);
            const memberExpenses = expensesData.filter(e => e.userId === member.id);
            
            return {
              id: member.id,
              meals: memberMeals.reduce((sum, meal) => sum + (meal.mealNumber || 1), 0),
              expenses: {
                food: memberExpenses.filter(e => e.category === 'Food').reduce((sum, e) => sum + e.amount, 0),
                electricity: memberExpenses.filter(e => e.category === 'Electricity').reduce((sum, e) => sum + e.amount, 0),
                gas: memberExpenses.filter(e => e.category === 'Gas').reduce((sum, e) => sum + e.amount, 0),
              }
            };
        });

        const targetMember = allMembersProcessed.find(m => m.id === memberId);
        if (!targetMember) return { notFound: true };

        const totalGroupFoodExpenses = allMembersProcessed.reduce((acc, m) => acc + m.expenses.food, 0);
        const totalGroupUtilities = allMembersProcessed.reduce((acc, m) => acc + (m.expenses.electricity + m.expenses.gas), 0);
        const totalGroupMeals = allMembersProcessed.reduce((acc, m) => acc + m.meals, 0);
        const memberCount = allMembersProcessed.length;

        const mealRate = totalGroupMeals > 0 ? totalGroupFoodExpenses / totalGroupMeals : 0;
        const utilitySharePerMember = memberCount > 0 ? totalGroupUtilities / memberCount : 0;

        const mealShare = targetMember.meals * mealRate;
        const mealBalance = targetMember.expenses.food - mealShare;
        const utilityPaid = targetMember.expenses.electricity + targetMember.expenses.gas;
        const utilityBalance = utilityPaid - utilitySharePerMember;
        const finalBalance = mealBalance + utilityBalance;
        
        const memberDailyMeals = mealsData.filter(m => m.userId === memberId);
        const memberDailyExpenses = expensesData.filter(e => e.userId === memberId);
        
        return {
            notFound: false,
            memberName,
            mealBalance,
            mealShare,
            utilityBalance,
            utilityPaid,
            utilitySharePerMember,
            finalBalance,
            foodPaid: targetMember.expenses.food,
            daysInMonth: eachDayOfInterval({ start: startOfMonth(targetDate), end: endOfMonth(targetDate) }),
            memberDailyMeals,
            memberDailyExpenses,
            totalMeals: targetMember.meals,
            totalFoodExpenses: targetMember.expenses.food,
            totalElectricityExpenses: targetMember.expenses.electricity,
            totalGasExpenses: targetMember.expenses.gas,
        };

    }, [isLoading, hasError, membersData, mealsData, expensesData, memberId, targetDate]);


    if (isLoading || !processedData) {
        return <ReportSkeleton />;
    }
    
    if (hasError) {
      return <DataError />
    }

    if (processedData.notFound) {
        notFound();
    }
    
    const {
        memberName, mealBalance, mealShare, utilityBalance, utilityPaid, utilitySharePerMember, finalBalance,
        foodPaid, daysInMonth, memberDailyMeals, memberDailyExpenses, totalMeals, totalFoodExpenses,
        totalElectricityExpenses, totalGasExpenses
    } = processedData;
    
    const monthQueryParam = format(targetDate, 'yyyy-MM-dd');

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href={`/report?month=${monthQueryParam}`}><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline">
                {memberName}'s Daily Log
              </h1>
              <p className="text-muted-foreground">
                A daily breakdown of meals and expenses for {format(targetDate, "MMMM yyyy")}.
              </p>
            </div>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5" /> Settlement Calculation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                 <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium text-muted-foreground">Meal Balance</span>
                    <div className="text-right">
                        <p className={cn("font-semibold", mealBalance >= 0 ? 'text-green-600' : 'text-red-600')}>
                            {mealBalance >= 0 ? `+৳${mealBalance.toFixed(2)}` : `-৳${Math.abs(mealBalance).toFixed(2)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">(Paid ৳{foodPaid.toFixed(2)} - Share ৳{mealShare.toFixed(2)})</p>
                    </div>
                </div>
                 <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium text-muted-foreground">Utility Balance</span>
                     <div className="text-right">
                        <p className={cn("font-semibold", utilityBalance >= 0 ? 'text-green-600' : 'text-red-600')}>
                            {utilityBalance >= 0 ? `+৳${utilityBalance.toFixed(2)}` : `-৳${Math.abs(utilityBalance).toFixed(2)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">(Paid ৳{utilityPaid.toFixed(2)} - Share ৳{utilitySharePerMember.toFixed(2)})</p>
                    </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-background border rounded-lg">
                    <span className="font-bold text-lg">Final Balance</span>
                     <div className="text-right">
                        <p className={cn("font-bold text-xl", finalBalance >= 0 ? 'text-green-600' : 'text-red-600')}>
                           {finalBalance >= 0 ? `Gets Back: ৳${finalBalance.toFixed(2)}` : `Owes: ৳${Math.abs(finalBalance).toFixed(2)}`}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Daily Meal Log</CardTitle>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Meals Logged</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {daysInMonth.map((day) => {
                                const dayString = format(day, "yyyy-MM-dd");
                                const mealsOnDay = memberDailyMeals
                                    .filter(m => format((m.date as Timestamp).toDate(), 'yyyy-MM-dd') === dayString)
                                    .reduce((sum, meal) => sum + meal.mealNumber, 0);
                                return (
                                    <TableRow key={dayString}>
                                        <TableCell className="font-medium">{format(day, "MMMM d, yyyy")}</TableCell>
                                        <TableCell className="text-right">{mealsOnDay || 0}</TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Meal Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 text-center pt-6">
                         <div className="p-4 bg-muted/50 rounded-lg">
                            <Utensils className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Total Meals This Month</p>
                            <p className="text-2xl font-bold">{totalMeals}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Expense Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-6">
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-lg text-muted-foreground">৳</span>
                                <span className="font-medium">Food Expenses</span>
                            </div>
                            <span className="text-lg font-bold">৳{totalFoodExpenses.toLocaleString()}</span>
                        </div>
                         <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Zap className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">Electricity Bill</span>
                            </div>
                            <span className="text-lg font-bold">৳{totalElectricityExpenses.toLocaleString()}</span>
                        </div>
                         <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                             <div className="flex items-center gap-3">
                                <Flame className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">Gas Bill</span>
                            </div>
                            <span className="text-lg font-bold">৳{totalGasExpenses.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}

    