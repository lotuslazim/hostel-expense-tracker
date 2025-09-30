
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Flame, Zap, Utensils, Scale, Users, FileText, AlertTriangle, ArrowRight } from "lucide-react";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { MealLog, Expense } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface MonthlySummaryProps {
  month: Date;
}

function SummarySkeleton() {
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <Skeleton className="h-36 w-full rounded-lg" />
            <Skeleton className="h-36 w-full rounded-lg" />
        </div>

        <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-7 w-40"/></CardTitle>
                <CardDescription><Skeleton className="h-4 w-80"/></CardDescription>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-40 w-full rounded-lg" />
            </CardContent>
        </Card>
    </div>
  );
}


function DataError() {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error Loading Summary</AlertTitle>
      <AlertDescription>
        There was a problem fetching the data for the monthly summary. Please try again later.
      </AlertDescription>
    </Alert>
  );
}


export function MonthlySummary({ month }: MonthlySummaryProps) {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();

  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading, error: currentUserDataError } = useDoc(currentUserRef);

  const groupId = currentUserData?.groupId;

  const monthDateRange = useMemo(() => {
    return {
      start: startOfMonth(month),
      end: endOfMonth(month),
    };
  }, [month]);

  const membersQuery = useMemo(() =>
    (groupId ? collection(firestore, `groups/${groupId}/members`) : null),
    [firestore, groupId]
  );
  
  const mealsQuery = useMemo(() =>
    (groupId ? query(
      collection(firestore, `groups/${groupId}/meals`),
      where("date", ">=", monthDateRange.start),
      where("date", "<=", monthDateRange.end)
    ) : null),
    [firestore, groupId, monthDateRange]
  );

  const expensesQuery = useMemo(() =>
    (groupId ? query(
      collection(firestore, `groups/${groupId}/expenses`),
      where("date", ">=", monthDateRange.start),
      where("date", "<=", monthDateRange.end)
    ) : null),
    [firestore, groupId, monthDateRange]
  );
  
  const { data: membersData, isLoading: areMembersLoading, error: membersError } = useCollection(membersQuery);
  const { data: mealsData, isLoading: areMealsLoading, error: mealsError } = useCollection<MealLog>(mealsQuery);
  const { data: expensesData, isLoading: areExpensesLoading, error: expensesError } = useCollection<Expense>(expensesQuery);

  const isAnyLoading = isCurrentUserLoading || isCurrentUserDataLoading || (!!groupId && (areMembersLoading || areMealsLoading || areExpensesLoading));
  const hasAnyErrors = currentUserDataError || membersError || mealsError || expensesError;
  
  const processedData = useMemo(() => {
    if (!membersData || !mealsData || !expensesData) {
      return null;
    }

    const processedMembers = membersData.map(member => {
        const memberMeals = mealsData.filter(m => m.userId === member.id);
        const memberExpenses = expensesData.filter(e => e.userId === member.id);
        
        const totalMeals = memberMeals.reduce((sum, meal) => sum + (meal.mealNumber || 1), 0);
        const foodExpenses = memberExpenses.filter(e => e.category === 'Food & Groceries').reduce((sum, e) => sum + e.amount, 0);
        const otherExpenses = memberExpenses.filter(e => e.category === 'Other').reduce((sum, e) => sum + e.amount, 0);
          
        return {
          id: member.id,
          name: member.displayName || member.email.split('@')[0],
          meals: totalMeals,
          expenses: { food: foodExpenses, other: otherExpenses }
        };
    });

    const totalGroupFoodExpenses = processedMembers.reduce((acc, member) => acc + member.expenses.food, 0);
    const totalGroupMeals = processedMembers.reduce((acc, member) => acc + member.meals, 0);
    const memberCount = processedMembers.length;
    
    const mealRate = totalGroupMeals > 0 ? totalGroupFoodExpenses / totalGroupMeals : 0;

    return {
        processedMembers,
        totalGroupFoodExpenses,
        totalGroupMeals,
        memberCount,
        mealRate,
    }
  }, [membersData, mealsData, expensesData]);

  if (isAnyLoading) {
    return <SummarySkeleton />;
  }

  if (hasAnyErrors) {
    return <DataError />;
  }
  
  if (!processedData) {
      return <SummarySkeleton />;
  }

  const {
      processedMembers,
      totalGroupFoodExpenses,
      totalGroupMeals,
      memberCount,
      mealRate,
  } = processedData;

  const monthQueryParam = format(month, 'yyyy-MM');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="flex flex-col">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Utensils/> Food & Meals</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                  <p className="text-3xl font-bold">৳{totalGroupFoodExpenses.toFixed(0)}</p>
                  <p className="text-sm text-muted-foreground">Total food expenses</p>
                   <p className="text-3xl font-bold">{totalGroupMeals}</p>
                  <p className="text-sm text-muted-foreground">Total meals consumed</p>
              </CardContent>
              <CardContent>
                 <div className="text-center p-3 bg-accent/20 rounded-lg">
                    <p className="text-sm font-medium text-accent-foreground/80">Calculated Meal Rate</p>
                    <p className="text-xl font-bold text-accent-foreground">৳{mealRate.toFixed(2)} / meal</p>
                </div>
              </CardContent>
          </Card>
           <Card className="flex flex-col">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText/> Detailed Reports</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-center gap-4">
                  <Link href={`/report/items?month=${monthQueryParam}`} className="block text-sm font-medium text-primary hover:underline">
                      View Food Item Analysis <ArrowRight className="inline h-4 w-4"/>
                  </Link>
                  <Link href={`/report/meals?month=${monthQueryParam}`} className="block text-sm font-medium text-primary hover:underline">
                      View Meal Consumption Report <ArrowRight className="inline h-4 w-4"/>
                  </Link>
              </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale /> Final Food Settlement
          </CardTitle>
          <CardDescription>
            A summary of who owes what for food costs for the month. Other expenses are not included here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Food Paid</TableHead>
                <TableHead className="text-right">Food Eaten (at meal rate)</TableHead>
                <TableHead className="text-right">Final Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberCount > 0 ? (
                processedMembers.map((member) => {
                  const mealShare = member.meals * mealRate;
                  const finalBalance = member.expenses.food - mealShare;

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.name}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ৳{member.expenses.food.toFixed(2)}
                      </TableCell>
                       <TableCell className="text-right">
                        ৳{mealShare.toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-bold",
                          finalBalance >= 0 ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {finalBalance >= 0
                          ? `Gets Back: ৳${finalBalance.toFixed(2)}`
                          : `Owes: ৳${Math.abs(finalBalance).toFixed(2)}`}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No members found for this month.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
