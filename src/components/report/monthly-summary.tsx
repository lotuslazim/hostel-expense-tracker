
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Flame, Zap, Utensils, Scale, Users, FileText, ArrowRight, ChevronDown, AlertTriangle } from "lucide-react";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, Timestamp } from "firebase/firestore";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { MealLog, Expense } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MonthlySummaryProps {
  month: Date;
}

// Type definitions for processed data
interface ProcessedMember {
  id: string;
  name: string;
  meals: number;
  memberMeals: MealLog[];
  foodAndOtherExpenses: number;
  utilityExpensesPaid: number;
  memberUtilityExpenses: Expense[];
  totalPaid: number;
}

interface ProcessedData {
  processedMembers: ProcessedMember[];
  totalGroupFoodAndOtherExpenses: number;
  totalGroupMeals: number;
  memberCount: number;
  mealRate: number;
  totalGroupExpenses: number;
  totalUtilityExpenses: number;
}

// Reusable utility functions
const sortByDateDesc = (a: { date: Date | Timestamp }, b: { date: Date | Timestamp }) => {
  const dateA = a.date instanceof Date ? a.date : (a.date as Timestamp)?.toDate?.();
  const dateB = b.date instanceof Date ? b.date : (b.date as Timestamp)?.toDate?.();
  return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
};

const formatDateSafe = (date: Date | Timestamp | undefined): string => {
  if (!date) return "N/A";
  const jsDate = date instanceof Date ? date : (date as Timestamp)?.toDate?.();
  return jsDate ? format(jsDate, 'MMM d, yyyy') : "N/A";
};

const formatShortDateSafe = (date: Date | Timestamp | undefined): string => {
  if (!date) return "N/A";
  const jsDate = date instanceof Date ? date : (date as Timestamp)?.toDate?.();
  return jsDate ? format(jsDate, 'MMM d') : "N/A";
};

// Empty State Component
function EmptyState({ icon: Icon, message }: { icon: React.ComponentType<any>, message: string }) {
  return (
    <div className="text-center py-8">
      <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
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

// Custom collapsible row component for table
function CollapsibleMemberRow({ 
  member, 
  perMemberShare,
  mealCost,
  utilityShare,
}: { 
  member: ProcessedMember;
  perMemberShare: number;
  mealCost: number;
  utilityShare: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const finalBalance = member.totalPaid - perMemberShare;

  return (
    <>
      {/* Main member row */}
      <TableRow className="transition-colors">
        <TableCell className="font-medium flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={`Toggle meal history for ${member.name}`}
            aria-expanded={isExpanded}
          >
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-200",
              isExpanded ? "rotate-180" : ""
            )} />
          </Button>
          {member.name}
        </TableCell>
        <TableCell>৳{(member.totalPaid || 0).toFixed(2)}</TableCell>
        <TableCell>৳{(perMemberShare || 0).toFixed(2)}</TableCell>
        <TableCell
          className={cn(
            "text-right font-bold p-0",
          )}
        >
          <div className={cn("px-4 py-4 rounded-md", finalBalance >= 0 ? "text-green-800" : "text-red-800")}>
            {finalBalance >= 0
              ? `Gets: ৳${(finalBalance || 0).toFixed(2)}`
              : `Owes: ৳${Math.abs(finalBalance || 0).toFixed(2)}`}
          </div>
        </TableCell>
      </TableRow>

      {/* Expandable content row */}
      {isExpanded && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={4} className="p-0">
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-background/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Meal Cost</p>
                    <p className="font-semibold text-lg">৳{mealCost.toFixed(2)}</p>
                  </div>
                  <div className="bg-background/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Utilities Share</p>
                    <p className="font-semibold text-lg">৳{utilityShare.toFixed(2)}</p>
                  </div>
              </div>

              {member.memberMeals?.length > 0 ? (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">
                    Meal History for {member.name} ({(member.meals || 0)} total meals)
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
                      {member.memberMeals.map((meal) => (
                        <TableRow key={meal.id}>
                          <TableCell>{formatDateSafe(meal.date)}</TableCell>
                          <TableCell className="capitalize">{meal.mealType}</TableCell>
                          <TableCell>{meal.mealNumber || 1}</TableCell>
                          <TableCell>{meal.itemName || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState icon={Users} message="No meals logged by this member." />
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// Custom collapsible utility component
function CollapsibleUtilityItem({ 
  member 
}: { 
  member: ProcessedMember;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b last:border-b-0 py-2">
      <button
        className="flex justify-between items-center w-full group hover:bg-muted/50 p-2 rounded-lg transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="font-medium">{member.name}</span>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground font-semibold">
            ৳{(member.utilityExpensesPaid || 0).toFixed(2)}
          </span>
          <div className="w-9 p-0 flex items-center justify-center">
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-200",
              isExpanded ? "rotate-180" : ""
            )} />
          </div>
        </div>
      </button>
      
      {isExpanded && (
        <div className="mt-2">
          {member.memberUtilityExpenses?.length > 0 ? (
            <Table className="bg-muted/50 rounded">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {member.memberUtilityExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatShortDateSafe(expense.date)}</TableCell>
                    <TableCell><Badge variant="outline">{expense.category}</Badge></TableCell>
                    <TableCell className="text-right">৳{(expense.amount || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState icon={AlertTriangle} message="No utility expenses paid by this member." />
          )}
        </div>
      )}
    </div>
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
      start: Timestamp.fromDate(startOfMonth(month)),
      end: Timestamp.fromDate(endOfMonth(month)),
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
  
  const processedData = useMemo((): ProcessedData | null => {
    if (!membersData || !mealsData || !expensesData) {
      return null;
    }

    const mealsByUser = mealsData.reduce((acc, meal) => {
      acc[meal.userId] = [...(acc[meal.userId] || []), meal];
      return acc;
    }, {} as Record<string, MealLog[]>);

    const expensesByUser = expensesData.reduce((acc, expense) => {
      acc[expense.userId] = [...(acc[expense.userId] || []), expense];
      return acc;
    }, {} as Record<string, Expense[]>);

    const processedMembers = membersData.map(member => {
      const memberMeals = (mealsByUser[member.id] || []).sort(sortByDateDesc);
      const memberExpenses = (expensesByUser[member.id] || []);

      const totalMeals = memberMeals.reduce((sum, meal) => sum + (meal.mealNumber || 1), 0);
      
      const foodAndOtherExpenses = memberExpenses
        .filter(e => e.category === 'Food & Groceries' || e.category === 'Other')
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      
      const memberUtilityExpenses = memberExpenses
        .filter(e => e.category === 'Electricity' || e.category === 'Gas')
        .sort(sortByDateDesc);
      
      const utilityExpensesPaid = memberUtilityExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      
      const totalPaid = memberExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      return {
        id: member.id,
        name: member.displayName || member.email?.split('@')[0] || 'Unknown User',
        meals: totalMeals,
        memberMeals,
        foodAndOtherExpenses,
        utilityExpensesPaid,
        memberUtilityExpenses,
        totalPaid,
      } as ProcessedMember;
    });

    const totalGroupFoodAndOtherExpenses = processedMembers.reduce((acc, member) => acc + (member.foodAndOtherExpenses || 0), 0);
    const totalGroupMeals = processedMembers.reduce((acc, member) => acc + (member.meals || 0), 0);
    const memberCount = processedMembers.length > 0 ? processedMembers.length : 1;
    const mealRate = totalGroupMeals > 0 ? totalGroupFoodAndOtherExpenses / totalGroupMeals : 0;
    const totalUtilityExpenses = expensesData.filter(e => e.category === 'Electricity' || e.category === 'Gas').reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalGroupExpenses = expensesData.reduce((sum, e) => sum + (e.amount || 0), 0);

    return {
      processedMembers,
      totalGroupFoodAndOtherExpenses,
      totalGroupMeals,
      memberCount,
      mealRate: mealRate || 0,
      totalGroupExpenses: totalGroupExpenses || 0,
      totalUtilityExpenses: totalUtilityExpenses || 0
    };
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
      totalGroupFoodAndOtherExpenses,
      totalGroupMeals,
      memberCount,
      mealRate,
      totalGroupExpenses,
      totalUtilityExpenses
  } = processedData;

  const perMemberShare = totalGroupExpenses / (memberCount || 1);
  const utilitySharePerMember = totalUtilityExpenses / (memberCount || 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-1 flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Utensils/> Food & Meals</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Food & Other Expenses</p>
                  <p className="text-2xl font-bold">৳{(totalGroupFoodAndOtherExpenses || 0).toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total meals consumed</p>
                  <p className="text-2xl font-bold">{totalGroupMeals || 0}</p>
                </div>
            </CardContent>
            <CardContent>
                <div className="text-center p-3 bg-accent/20 rounded-lg">
                  <p className="text-sm font-medium text-accent-foreground/80">Calculated Meal Rate</p>
                  <p className="text-xl font-bold text-accent-foreground">৳{(mealRate || 0).toFixed(2)} / meal</p>
              </div>
            </CardContent>
        </Card>
        
       <Card className="lg:col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap/> Utilities Breakdown</CardTitle>
           <CardDescription>A summary of monthly utility payments.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
             <div>
                <p className="text-sm text-muted-foreground">Total Utility Expenses</p>
                <p className="text-2xl font-bold">৳{(totalUtilityExpenses || 0).toFixed(0)}</p>
            </div>
            <div className="space-y-2 pt-2">
                <p className="text-sm font-medium">Member Contributions</p>
                 {processedMembers.length > 0 ? (
                    processedMembers.map((member) => (
                    <CollapsibleUtilityItem 
                        key={member.id} 
                        member={member}
                    />
                    ))
                ) : (
                    <EmptyState icon={Users} message="No utility data available." />
                )}
            </div>
        </CardContent>
      </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale /> Final Settlement
          </CardTitle>
          <CardDescription>
            A summary of who owes what, including all food, utility, and other costs for the month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Share of Costs</TableHead>
                <TableHead className="text-right">Final Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedMembers.length > 0 ? (
                processedMembers.map((member) => (
                  <CollapsibleMemberRow
                    key={member.id}
                    member={member}
                    perMemberShare={perMemberShare}
                    mealCost={member.meals * mealRate}
                    utilityShare={utilitySharePerMember}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyState icon={Users} message="No members found." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>Total</TableCell>
                <TableCell>৳{(totalGroupExpenses || 0).toFixed(2)}</TableCell>
                <TableCell>৳{((perMemberShare || 0) * (memberCount || 1)).toFixed(2)}</TableCell>
                <TableCell className="text-right">৳0.00</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

    

    