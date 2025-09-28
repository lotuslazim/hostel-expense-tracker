
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Flame, Zap, Utensils, Scale, Users, FileText, AlertTriangle } from "lucide-react";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { Meal, Expense } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface MonthlySummaryProps {
  month: Date;
}

function SummarySkeleton() {
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-7 w-48"/></CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                </div>
                 <div className="text-center p-4 mt-4 bg-accent/20 rounded-lg">
                    <Skeleton className="h-5 w-1/3 mx-auto rounded-lg" />
                    <Skeleton className="h-8 w-1/4 mx-auto mt-2 rounded-lg" />
                </div>
            </CardContent>
        </Card>
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

  const isAnyLoading = isCurrentUserLoading || isCurrentUserDataLoading || (!!groupId && (areMembersLoading || areMealsLoading || areExpensesLoading));
  const hasAnyErrors = currentUserDataError || membersError || mealsError || expensesError;
  
  const processedData = useMemo(() => {
    if (isAnyLoading || hasAnyErrors || !membersData || !mealsData || !expensesData) {
      return null;
    }

    const processedMembers = membersData.map(member => {
        const memberMeals = mealsData.filter(m => m.userId === member.id);
        const memberExpenses = expensesData.filter(e => e.userId === member.id);
        
        const totalMeals = memberMeals.reduce((sum, meal) => sum + (meal.mealNumber || 1), 0);
        const foodExpenses = memberExpenses.filter(e => e.category === 'Food').reduce((sum, e) => sum + e.amount, 0);
        const electricityExpenses = memberExpenses.filter(e => e.category === 'Electricity').reduce((sum, e) => sum + e.amount, 0);
        const gasExpenses = memberExpenses.filter(e => e.category === 'Gas').reduce((sum, e) => sum + e.amount, 0);
          
        return {
          id: member.id,
          name: member.displayName || member.email.split('@')[0],
          meals: totalMeals,
          expenses: { food: foodExpenses, electricity: electricityExpenses, gas: gasExpenses }
        };
    });

    const totalGroupFoodExpenses = processedMembers.reduce((acc, member) => acc + member.expenses.food, 0);
    const totalGroupElectricity = processedMembers.reduce((acc, member) => acc + member.expenses.electricity, 0);
    const totalGroupGas = processedMembers.reduce((acc, member) => acc + member.expenses.gas, 0);
    const totalGroupMeals = processedMembers.reduce((acc, member) => acc + member.meals, 0);
    const memberCount = processedMembers.length;
    
    // Prevent division by zero
    const mealRate = totalGroupMeals > 0 ? totalGroupFoodExpenses / totalGroupMeals : 0;

    return {
        processedMembers,
        totalGroupFoodExpenses,
        totalGroupElectricity,
        totalGroupGas,
        totalGroupMeals,
        memberCount,
        mealRate,
    }
  }, [isAnyLoading, hasAnyErrors, membersData, mealsData, expensesData]);

  if (isAnyLoading || (groupId && !processedData)) {
    return <SummarySkeleton />;
  }

  if (hasAnyErrors) {
    return <DataError />;
  }
  
  const {
      processedMembers,
      totalGroupFoodExpenses,
      totalGroupElectricity,
      totalGroupGas,
      totalGroupMeals,
      memberCount,
      mealRate,
  } = processedData!;

  const monthQueryParam = format(month, 'yyyy-MM-dd');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overall Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <Link
              href={`/report/items?month=${monthQueryParam}`}
              className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1 whitespace-nowrap">
                <FileText className="h-4 w-4"/> Food Expenses
              </p>
              <p className="text-2xl font-bold">
                ৳{totalGroupFoodExpenses.toFixed(0)}
              </p>
            </Link>
             <Link
              href={`/report/contribution/Electricity?month=${monthQueryParam}`}
              className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1 whitespace-nowrap">
                <Zap className="h-4 w-4"/> Electricity
              </p>
              <p className="text-2xl font-bold">
                ৳{totalGroupElectricity.toFixed(0)}
              </p>
            </Link>
            <Link
              href={`/report/contribution/Gas?month=${monthQueryParam}`}
              className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1 whitespace-nowrap">
                <Flame className="h-4 w-4"/> Gas
              </p>
              <p className="text-2xl font-bold">
                ৳{totalGroupGas.toFixed(0)}
              </p>
            </Link>
            <div
              className="block p-4 bg-muted/50 rounded-lg"
            >
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1 whitespace-nowrap">
                <Utensils className="h-4 w-4"/> Total Meals
              </p>
              <p className="text-2xl font-bold">{totalGroupMeals}</p>
            </div>
          </div>
          <div className="text-center p-4 bg-accent/20 rounded-lg mt-4">
            <p className="text-sm font-medium text-accent-foreground/80">
              Calculated Meal Rate
            </p>
            <p className="text-2xl font-bold text-accent-foreground">
              ৳{mealRate.toFixed(2)} / meal
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale /> Final Settlement
          </CardTitle>
          <CardDescription>
            A summary of who owes what for the month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Total Paid</TableHead>
                <TableHead className="text-right">Final Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberCount > 0 ? (
                processedMembers.map((member) => {
                  const utilitySharePerMember =
                    memberCount > 0
                      ? (totalGroupElectricity + totalGroupGas) / memberCount
                      : 0;
                  const mealShare = member.meals * mealRate;
                  const mealBalance = member.expenses.food - mealShare;
                  const utilityPaid =
                    member.expenses.electricity + member.expenses.gas;
                  const utilityBalance = utilityPaid - utilitySharePerMember;
                  const finalBalance = mealBalance + utilityBalance;
                  const totalPaid = member.expenses.food + utilityPaid;

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.name}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ৳{totalPaid.toFixed(2)}
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
                  <TableCell colSpan={3} className="text-center h-24">
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
