
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { notFound, useSearchParams } from "next/navigation";
import { eachDayOfInterval, startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import { ArrowLeft, Utensils, Zap, Flame, Scale } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { useMemo } from "react";
import type { Meal, Expense } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import type { Timestamp } from "firebase/firestore";

function ReportSkeleton() {
  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5" /> Settlement Calculation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-20 w-full" />
            </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Daily Meal Log</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-96 w-full" />
                </CardContent>
            </Card>
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Meal Summary</CardTitle></CardHeader>
                    <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Expense Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
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


export default function MemberReportPage({ params }: { params: { memberId: string } }) {
    const memberId = params.memberId;
    const searchParams = useSearchParams();
    const monthParam = searchParams.get('month');
    
    const { firestore } = useFirebase();
    const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();

    const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);
    const groupId = currentUserData?.groupId;

    const targetDate = monthParam ? parseISO(monthParam) : new Date();

    const monthDateRange = useMemo(() => {
        return {
          start: startOfMonth(targetDate),
          end: endOfMonth(targetDate),
        };
    }, [targetDate]);

    // Queries
    const membersQuery = useMemoFirebase(() =>
        groupId ? collection(firestore, `groups/${groupId}/members`) : null,
        [firestore, groupId]
    );
    
    const mealsQuery = useMemoFirebase(() =>
        groupId ? query(
        collection(firestore, `groups/${groupId}/meals`),
        where("date", ">=", monthDateRange.start),
        where("date", "<=", monthDateRange.end)
        ) : null,
        [firestore, groupId, monthDateRange]
    );

    const expensesQuery = useMemoFirebase(() =>
        groupId ? query(
        collection(firestore, `groups/${groupId}/expenses`),
        where("date", ">=", monthDateRange.start),
        where("date", "<=", monthDateRange.end)
        ) : null,
        [firestore, groupId, monthDateRange]
    );

    const { data: members, isLoading: areMembersLoading } = useCollection(membersQuery);
    const { data: meals, isLoading: areMealsLoading } = useCollection<Meal>(mealsQuery);
    const { data: expenses, isLoading: areExpensesLoading } = useCollection<Expense>(expensesQuery);

    
    const dataLoading = isCurrentUserLoading || isCurrentUserDataLoading || areMembersLoading || areMealsLoading || areExpensesLoading;

    if (dataLoading) {
        return <ReportSkeleton />;
    }
    
    if (!members || !meals || !expenses) {
        return <Card><CardContent><p className="text-center text-muted-foreground py-8">No data available for this report.</p></CardContent></Card>;
    }

    const memberData = members.find(m => m.id === memberId);
    if (!memberData) {
        notFound();
    }
    const memberName = memberData.displayName || memberData.email.split('@')[0];

    const processedMembers = (members || []).map(member => {
        const memberMealsData = (meals || []).filter(m => m.userId === member.id);
        const memberExpensesData = (expenses || []).filter(e => e.userId === member.id);
        
        const totalMeals = memberMealsData.reduce((sum, meal) => sum + (meal.mealNumber || 1), 0);
  
        const foodExpenses = memberExpensesData
          .filter(e => e.category === 'Food')
          .reduce((sum, e) => sum + e.amount, 0);
        
        const electricityExpenses = memberExpensesData
          .filter(e => e.category === 'Electricity')
          .reduce((sum, e) => sum + e.amount, 0);
  
        const gasExpenses = memberExpensesData
          .filter(e => e.category === 'Gas')
          .reduce((sum, e) => sum + e.amount, 0);
          
        return {
          id: member.id,
          name: member.displayName || member.email.split('@')[0],
          meals: totalMeals,
          expenses: {
            food: foodExpenses,
            electricity: electricityExpenses,
            gas: gasExpenses,
          }
        };
    });

    const member = processedMembers.find(m => m.id === memberId);
     if (!member) {
        notFound();
    }


    // Calculations from monthly-summary
    const totalGroupFoodExpenses = processedMembers.reduce((acc, member) => acc + member.expenses.food, 0);
    const totalGroupElectricity = processedMembers.reduce((acc, member) => acc + member.expenses.electricity, 0);
    const totalGroupGas = processedMembers.reduce((acc, member) => acc + member.expenses.gas, 0);
    const totalGroupUtilities = totalGroupElectricity + totalGroupGas;
    const totalGroupMeals = processedMembers.reduce((acc, member) => acc + member.meals, 0);
    const memberCount = processedMembers.length;

    const mealRate = totalGroupFoodExpenses > 0 && totalGroupMeals > 0 ? totalGroupFoodExpenses / totalGroupMeals : 0;
    const utilitySharePerMember = memberCount > 0 ? totalGroupUtilities / memberCount : 0;

    const mealShare = member.meals * mealRate;
    const mealBalance = member.expenses.food - mealShare;
    const utilityPaid = member.expenses.electricity + member.expenses.gas;
    const utilityBalance = utilityPaid - utilitySharePerMember;
    const finalBalance = mealBalance + utilityBalance;

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(targetDate),
        end: endOfMonth(targetDate),
    });

    const memberDailyMeals = meals.filter(m => m.userId === memberId);
    const memberDailyExpenses = expenses.filter(e => e.userId === memberId);

    const totalMeals = memberDailyMeals.reduce((acc, day) => acc + day.mealNumber, 0);
    const totalFoodExpenses = memberDailyExpenses.filter(e=>e.category === 'Food').reduce((acc, day) => acc + day.amount, 0);
    const totalElectricityExpenses = memberDailyExpenses.filter(e=>e.category === 'Electricity').reduce((acc, day) => acc + day.amount, 0);
    const totalGasExpenses = memberDailyExpenses.filter(e=>e.category === 'Gas').reduce((acc, day) => acc + day.amount, 0);
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
            <CardContent className="space-y-4">
                 <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium text-muted-foreground">Meal Balance</span>
                    <div className="text-right">
                        <p className={cn("font-semibold", mealBalance >= 0 ? 'text-green-600' : 'text-red-600')}>
                            {mealBalance >= 0 ? `+৳${mealBalance.toFixed(2)}` : `-৳${Math.abs(mealBalance).toFixed(2)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">(Paid ৳{member.expenses.food.toFixed(2)} - Share ৳{mealShare.toFixed(2)})</p>
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
                    <CardContent className="grid grid-cols-1 gap-4 text-center">
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
                    <CardContent className="space-y-3">
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
                         <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
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

    