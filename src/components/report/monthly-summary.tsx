
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Flame, Zap, Utensils, Scale, Users, FileText } from "lucide-react";
import { useFirebase, useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { Meal, Expense } from "@/lib/types";
import { startOfMonth, endOfMonth } from 'date-fns';

interface MonthlySummaryProps {
  month: Date;
}

function SummarySkeleton() {
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48"/>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
                 <div className="text-center p-4 bg-accent/20 rounded-lg mt-4">
                    <Skeleton className="h-6 w-1/2 mx-auto" />
                    <Skeleton className="h-8 w-1/3 mx-auto mt-2" />
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-40"/>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-40 w-full" />
            </CardContent>
        </Card>
    </div>
  );
}


export function MonthlySummary({ month }: MonthlySummaryProps) {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();

  const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);

  const groupId = currentUserData?.groupId;

  const monthDateRange = useMemo(() => {
    return {
      start: startOfMonth(month),
      end: endOfMonth(month),
    };
  }, [month]);

  // Queries for members, meals, and expenses
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
    return <SummarySkeleton />;
  }

  const hasMembers = members && members.length > 0;
  
  const processedMembers = (members || []).map(member => {
      const memberMeals = (meals || []).filter(m => m.userId === member.id);
      const memberExpenses = (expenses || []).filter(e => e.userId === member.id);
      
      const totalMeals = memberMeals.reduce((sum, meal) => sum + (meal.mealNumber || 1), 0);

      const foodExpenses = memberExpenses
        .filter(e => e.category === 'Food')
        .reduce((sum, e) => sum + e.amount, 0);
      
      const electricityExpenses = memberExpenses
        .filter(e => e.category === 'Electricity')
        .reduce((sum, e) => sum + e.amount, 0);

      const gasExpenses = memberExpenses
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

  const totalGroupFoodExpenses = processedMembers.reduce((acc, member) => acc + member.expenses.food, 0);
  const totalGroupElectricity = processedMembers.reduce((acc, member) => acc + member.expenses.electricity, 0);
  const totalGroupGas = processedMembers.reduce((acc, member) => acc + member.expenses.gas, 0);
  const totalGroupMeals = processedMembers.reduce((acc, member) => acc + member.meals, 0);
  const memberCount = processedMembers.length;
  
  const mealRate = totalGroupFoodExpenses > 0 && totalGroupMeals > 0 ? totalGroupFoodExpenses / totalGroupMeals : 0;
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
                <FileText /> Food Expenses
              </p>
              <p className="text-2xl font-bold">
                ৳{totalGroupFoodExpenses.toFixed(0)}
              </p>
            </Link>
            <Link
              href={`/report/contribution/electricity?month=${monthQueryParam}`}
              className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1 whitespace-nowrap">
                <Zap /> Electricity
              </p>
              <p className="text-2xl font-bold">
                ৳{totalGroupElectricity.toFixed(0)}
              </p>
            </Link>
            <Link
              href={`/report/contribution/gas?month=${monthQueryParam}`}
              className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1 whitespace-nowrap">
                <Flame /> Gas
              </p>
              <p className="text-2xl font-bold">
                ৳{totalGroupGas.toFixed(0)}
              </p>
            </Link>
            <Link
              href={`/report/meal-settlement?month=${monthQueryParam}`}
              className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1 whitespace-nowrap">
                <Utensils /> Total Meals
              </p>
              <p className="text-2xl font-bold">{totalGroupMeals}</p>
            </Link>
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
              {hasMembers ? (
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
                        <Link
                          href={`/report/${member.id}?month=${monthQueryParam}`}
                          className="hover:underline text-primary"
                        >
                          {member.name}
                        </Link>
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
