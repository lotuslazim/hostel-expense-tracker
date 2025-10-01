
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Utensils, Scale, Users, ChevronDown, AlertTriangle, Zap, Bolt, Flame } from "lucide-react";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, type Timestamp } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { MealLog, Expense } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MonthlySummaryProps {
  month: Date;
}

function SummarySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
      </div>
       <Skeleton className="h-96 w-full rounded-lg" />
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
    
    const foodAndOtherExpenses = expensesData.filter(e => e.category === 'Food & Groceries' || e.category === 'Other');
    const totalFoodAndOtherExpenses = foodAndOtherExpenses.reduce((sum, e) => sum + e.amount, 0);

    const utilityExpenses = expensesData.filter(e => e.category === 'Electricity' || e.category === 'Gas');
    const totalElectricity = utilityExpenses.filter(e => e.category === 'Electricity').reduce((s, e) => s + e.amount, 0);
    const totalGas = utilityExpenses.filter(e => e.category === 'Gas').reduce((s, e) => s + e.amount, 0);
    const totalUtilities = totalElectricity + totalGas;

    const processedMembers = membersData.map(member => {
        const memberMeals = mealsData
          .filter(m => m.userId === member.id)
          .sort((a, b) => {
            const dateA = a.date instanceof Date ? a.date : (a.date as Timestamp)?.toDate();
            const dateB = b.date instanceof Date ? b.date : (b.date as Timestamp)?.toDate();
            return dateB.getTime() - dateA.getTime();
          });
          
        const memberFoodAndOtherExpenses = foodAndOtherExpenses.filter(e => e.userId === member.id);
        const memberUtilityExpenses = utilityExpenses.filter(e => e.userId === member.id);
        
        const paidForFood = memberFoodAndOtherExpenses.reduce((sum, e) => sum + e.amount, 0);
        const paidForUtilities = memberUtilityExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        return {
          id: member.id,
          name: member.displayName || member.email.split('@')[0],
          meals: memberMeals,
          totalMeals: memberMeals.reduce((s, m) => s + m.mealNumber, 0),
          paidForFood,
          paidForUtilities,
          utilityExpenses: memberUtilityExpenses
        };
    });

    const totalGroupMeals = processedMembers.reduce((acc, member) => acc + member.totalMeals, 0);
    const mealRate = totalGroupMeals > 0 ? totalFoodAndOtherExpenses / totalGroupMeals : 0;
    const utilityShare = membersData.length > 0 ? totalUtilities / membersData.length : 0;

    const finalMembers = processedMembers.map(member => {
        const mealCost = member.totalMeals * mealRate;
        const totalShare = mealCost + utilityShare;
        const totalPaid = member.paidForFood + member.paidForUtilities;
        const balance = totalPaid - totalShare;

        return {
            ...member,
            mealCost,
            utilityShare,
            totalShare,
            totalPaid,
            balance
        }
    });

    return {
        processedMembers: finalMembers,
        totalGroupMeals,
        mealRate,
        totalFoodAndOtherExpenses,
        totalElectricity,
        totalGas,
        totalUtilities
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
      totalGroupMeals,
      mealRate,
      totalFoodAndOtherExpenses,
      totalElectricity,
      totalGas,
      totalUtilities
  } = processedData;

  const formatDateSafe = (date: Date | Timestamp | undefined): string => {
    if (!date) return "N/A";
    const jsDate = date instanceof Date ? date : (date as Timestamp)?.toDate?.();
    return jsDate ? format(jsDate, 'MMM d, yyyy') : "N/A";
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Utensils/> Meals & Rate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Total meals consumed</p>
                        <p className="text-2xl font-bold">{totalGroupMeals}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Food & Other Expenses</p>
                        <p className="text-2xl font-bold">৳{totalFoodAndOtherExpenses.toFixed(2)}</p>
                    </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Calculated Meal Rate</p>
                  <p className="text-3xl font-bold text-primary">৳{mealRate.toFixed(2)}</p>
                </div>
            </CardContent>
        </Card>
        
       <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap/> Utilities Breakdown</CardTitle>
                <CardDescription>A summary of who paid for utilities this month.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><Bolt className="h-4 w-4"/>Total Electricity</p>
                        <p className="text-xl font-bold">৳{totalElectricity.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><Flame className="h-4 w-4"/>Total Gas</p>
                        <p className="text-xl font-bold">৳{totalGas.toFixed(2)}</p>
                    </div>
                </div>
                {processedMembers.map((member) => (
                    <Collapsible key={member.id} className="border rounded-lg group">
                        <CollapsibleTrigger asChild>
                            <div className="flex items-center p-3 cursor-pointer">
                                <span className="font-medium flex-1">{member.name}</span>
                                <span className="text-sm text-muted-foreground mr-4">Paid: <span className="font-semibold text-foreground">৳{member.paidForUtilities.toFixed(2)}</span></span>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                </Button>
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="p-3 bg-muted/50 border-t">
                                {member.utilityExpenses.length > 0 ? (
                                    <div className="space-y-2">
                                        {member.utilityExpenses.map(expense => (
                                            <div key={expense.id} className="flex justify-between items-center text-sm">
                                                <Badge variant={expense.category === 'Electricity' ? 'default' : 'secondary'} className="capitalize">{expense.category}</Badge>
                                                <span>৳{expense.amount.toFixed(2)}</span>
                                                <span className="text-muted-foreground">{formatDateSafe(expense.date)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-center text-muted-foreground py-2">No utilities paid by this member.</p>
                                )}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                ))}
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale /> Final Settlement
          </CardTitle>
          <CardDescription>
            A summary of who owes what for all shared costs. Click a member to see their meal history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Total Share</TableHead>
                <TableHead className="text-right">Final Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedMembers.length > 0 ? (
                processedMembers.map((member) => {
                  return (
                    <Collapsible key={member.id} asChild>
                      <>
                      <TableRow className="group" data-state={open ? 'open' : 'closed'}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Toggle meal history for ${member.name}`}
                            >
                              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </Button>
                          </CollapsibleTrigger>
                          {member.name}
                        </TableCell>
                        <TableCell>৳{member.totalPaid.toFixed(2)}</TableCell>
                        <TableCell>৳{member.totalShare.toFixed(2)}</TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-bold",
                            member.balance >= 0 ? "text-green-600" : "text-red-600"
                          )}
                        >
                          {member.balance >= 0
                            ? `Gets: ৳${member.balance.toFixed(2)}`
                            : `Owes: ৳${Math.abs(member.balance).toFixed(2)}`}
                        </TableCell>
                      </TableRow>
                      <TableRow className="data-[state=closed]:hidden">
                        <TableCell colSpan={5} className="p-0 bg-muted/50">
                          <CollapsibleContent asChild>
                            <div className="p-4">
                              {member.meals.length > 0 ? (
                                <>
                                  <h4 className="font-semibold mb-2 text-sm">
                                    Meal History for {member.name} ({member.totalMeals} total meals)
                                  </h4>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Meal Type</TableHead>
                                        <TableHead>Count</TableHead>
                                        <TableHead>Item Name</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {member.meals.map((meal) => (
                                        <TableRow key={meal.id}>
                                          <TableCell>
                                            {formatDateSafe(meal.date)}
                                          </TableCell>
                                          <TableCell className="capitalize">
                                            {meal.mealType}
                                          </TableCell>
                                          <TableCell>{meal.mealNumber}</TableCell>
                                          <TableCell>{meal.itemName || "N/A"}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </>
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No meals logged by this member.
                                </p>
                              )}
                            </div>
                          </CollapsibleContent>
                        </TableCell>
                      </TableRow>
                      </>
                    </Collapsible>
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
