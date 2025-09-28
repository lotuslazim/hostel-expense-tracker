
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Utensils, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import type { Meal, Expense } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

function MealSettlementSkeleton() {
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
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Utensils className="h-5 w-5"/>
                        <Skeleton className="h-6 w-56" />
                    </span>
                    <div className="text-right">
                        <p className="text-sm font-medium text-primary">Meal Rate</p>
                        <Skeleton className="h-7 w-24 mt-1" />
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-48 w-full" />
            </CardContent>
        </Card>
    </div>
  )
}


export default function MealSettlementPage() {
    const searchParams = useSearchParams();
    const monthParam = searchParams.get('month');
    const targetDate = monthParam ? parseISO(monthParam) : new Date();

    const { firestore } = useFirebase();
    const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();

    const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);
    const groupId = currentUserData?.groupId;

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
        return <MealSettlementSkeleton />;
    }
    
    if (!members) {
      return <Card><CardContent><p className="text-center text-destructive py-8">Could not load members.</p></CardContent></Card>;
    }
    
    const hasMembers = members.length > 0;
    const foodExpenses = (expenses || []).filter(e => e.category === 'Food');
    const totalGroupFoodExpenses = foodExpenses.reduce((acc, expense) => acc + expense.amount, 0);
    const totalGroupMeals = (meals || []).reduce((acc, meal) => acc + meal.mealNumber, 0);
    const mealRate = totalGroupMeals > 0 ? totalGroupFoodExpenses / totalGroupMeals : 0;
    const monthQueryParam = format(targetDate, 'yyyy-MM-dd');

    const settlementData = members.map(member => {
      const memberMeals = (meals || []).filter(m => m.userId === member.id).reduce((sum, m) => sum + m.mealNumber, 0);
      const memberFoodPaid = foodExpenses.filter(e => e.userId === member.id).reduce((sum, e) => sum + e.amount, 0);

      const mealShare = memberMeals * mealRate;
      const mealBalance = memberFoodPaid - mealShare;
      return {
        id: member.id,
        name: member.displayName || member.email.split('@')[0],
        meals: memberMeals,
        expenses: { food: memberFoodPaid },
        mealShare,
        mealBalance,
      };
    });

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href={`/report?month=${monthQueryParam}`}><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline">
                Monthly Meal Settlement
              </h1>
              <p className="text-muted-foreground">
                Breakdown of meal costs for {format(targetDate, "MMMM yyyy")}.
              </p>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Utensils className="h-5 w-5"/>
                        Meal Contribution per Member
                    </span>
                    <div className="text-right">
                        <p className="text-sm font-medium text-primary">Meal Rate</p>
                        <p className="text-xl font-bold text-primary">৳{mealRate.toFixed(2)}</p>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead className="text-center">Meals</TableHead>
                        <TableHead className="text-right">Food Paid</TableHead>
                        <TableHead className="text-right">Meal Share</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hasMembers ? settlementData.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            <Link href={`/report/${member.id}?month=${monthQueryParam}`} className="hover:underline text-primary">
                              {member.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-center">{member.meals}</TableCell>
                          <TableCell className="text-right">৳{member.expenses.food.toFixed(2)}</TableCell>
                          <TableCell className="text-right">৳{member.mealShare.toFixed(2)}</TableCell>
                          <TableCell className={cn(
                            "text-right font-medium",
                            member.mealBalance >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {member.mealBalance >= 0 ? `+৳${member.mealBalance.toFixed(2)}` : `-৳${Math.abs(member.mealBalance).toFixed(2)}`}
                          </TableCell>
                        </TableRow>
                      )) : (
                         <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                               <div className="flex flex-col items-center gap-2">
                                   <Users className="h-8 w-8 text-muted-foreground" />
                                   <p className="text-muted-foreground">No members in this group for the selected month.</p>
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

    
