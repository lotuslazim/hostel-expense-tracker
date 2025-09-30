
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Flame, Zap, Utensils, Scale, Users, FileText, ArrowRight } from "lucide-react";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, type Timestamp } from "firebase/firestore";
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
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

    const utilityExpenses = expensesData
        .filter(e => e.category === 'Electricity' || e.category === 'Gas');

    const processedMembers = membersData.map(member => {
        const memberMeals = mealsData.filter(m => m.userId === member.id);
        const memberExpenses = expensesData.filter(e => e.userId === member.id);
        
        const totalMeals = memberMeals.reduce((sum, meal) => sum + (meal.mealNumber || 1), 0);
        const foodExpenses = memberExpenses.filter(e => e.category === 'Food & Groceries').reduce((sum, e) => sum + e.amount, 0);
        const utilityExpensesPaid = memberExpenses.filter(e => e.category === 'Electricity' || e.category === 'Gas').reduce((sum, e) => sum + e.amount, 0);

        return {
          id: member.id,
          name: member.displayName || member.email.split('@')[0],
          meals: totalMeals,
          foodExpenses: foodExpenses,
          utilityExpensesPaid: utilityExpensesPaid,
        };
    });

    const totalGroupFoodExpenses = processedMembers.reduce((acc, member) => acc + member.foodExpenses, 0);
    const totalGroupMeals = processedMembers.reduce((acc, member) => acc + member.meals, 0);
    const memberCount = processedMembers.length;
    const mealRate = totalGroupMeals > 0 ? totalGroupFoodExpenses / totalGroupMeals : 0;
    
    const totalGroupElectricityExpenses = utilityExpenses.filter(e => e.category === 'Electricity').reduce((acc, e) => acc + e.amount, 0);
    const totalGroupGasExpenses = utilityExpenses.filter(e => e.category === 'Gas').reduce((acc, e) => acc + e.amount, 0);

    return {
        processedMembers,
        totalGroupFoodExpenses,
        totalGroupMeals,
        memberCount,
        mealRate,
        utilityExpenses: utilityExpenses.sort((a, b) => (b.date as Timestamp).toDate().getTime() - (a.date as Timestamp).toDate().getTime()),
        totalGroupElectricityExpenses,
        totalGroupGasExpenses,
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
      utilityExpenses,
      totalGroupElectricityExpenses,
      totalGroupGasExpenses,
  } = processedData;

  const monthQueryParam = format(month, 'yyyy-MM');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <Card className="lg:col-span-1 flex flex-col">
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><Utensils/> Food & Meals</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total food expenses</p>
                <p className="text-2xl font-bold">৳{totalGroupFoodExpenses.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total meals consumed</p>
                <p className="text-2xl font-bold">{totalGroupMeals}</p>
              </div>
          </CardContent>
          <CardContent>
              <div className="text-center p-3 bg-accent/20 rounded-lg">
                <p className="text-sm font-medium text-accent-foreground/80">Calculated Meal Rate</p>
                <p className="text-xl font-bold text-accent-foreground">৳{mealRate.toFixed(2)} / meal</p>
            </div>
          </CardContent>
      </Card>
      
      <Card className="lg:col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap/> Utility Contributions</CardTitle>
           <CardDescription>Total spent on utilities this month. Click a member for details.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">Total Electricity Bill</p>
            <p className="text-lg font-bold">৳{totalGroupElectricityExpenses.toFixed(0)}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">Total Gas Bill</p>
            <p className="text-lg font-bold">৳{totalGroupGasExpenses.toFixed(0)}</p>
          </div>
        </CardContent>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedMembers.length > 0 ? (
                processedMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Link href={`/report/utilities/${member.id}?month=${monthQueryParam}`} className="font-medium hover:underline">
                        {member.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">৳{member.utilityExpensesPaid.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center h-24 text-muted-foreground">No utility data.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale /> Final Food Settlement
          </CardTitle>
          <CardDescription>
            A summary of who owes what for food costs for the month. Other expenses are not included here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Food Paid</TableHead>
                <TableHead>Food Eaten</TableHead>
                <TableHead className="text-right">Final Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberCount > 0 ? (
                processedMembers.map((member) => {
                  const mealShare = member.meals * mealRate;
                  const finalBalance = member.foodExpenses - mealShare;

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.name}
                      </TableCell>
                       <TableCell>
                        ৳{member.foodExpenses.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        ৳{mealShare.toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-bold",
                          finalBalance >= 0 ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {finalBalance >= 0
                          ? `+ ৳${finalBalance.toFixed(2)}`
                          : `- ৳${Math.abs(finalBalance).toFixed(2)}`}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                     <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                     <p className="text-muted-foreground">No members found.</p>
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
