
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Flame, Zap, Utensils, Scale, Users, FileText, ArrowRight, ChevronDown, AlertTriangle, Package, Receipt } from "lucide-react";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, Timestamp } from "firebase/firestore";
import { useMemo, useState, lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns/format';
import { startOfMonth } from 'date-fns/startOfMonth';
import { endOfMonth } from 'date-fns/endOfMonth';
import { addMonths } from 'date-fns/addMonths';
import { subMonths } from 'date-fns/subMonths';
import type { MealLog, Expense } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MonthSwitcher } from "./month-switcher";
import dynamic from 'next/dynamic';

const Dialog = dynamic(() => import('../ui/dialog').then(module => ({ default: module.Dialog })), { ssr: false });
const DialogContent = dynamic(() => import('../ui/dialog').then(module => ({ default: module.DialogContent })), { ssr: false });
const DialogHeader = dynamic(() => import('../ui/dialog').then(module => ({ default: module.DialogHeader })), { ssr: false });
const DialogTitle = dynamic(() => import('../ui/dialog').then(module => ({ default: module.DialogTitle })), { ssr: false });
const DialogTrigger = dynamic(() => import('../ui/dialog').then(module => ({ default: module.DialogTrigger })), { ssr: false });


// Type definitions for processed data
interface ProcessedMember {
  id: string;
  name: string;
  photoURL?: string;
  meals: number;
  memberMeals: MealLog[];
  foodExpenses: number;
  otherExpenses: number;
  utilityExpensesPaid: number;
  memberUtilityExpenses: Expense[];
  totalPaid: number;
}

interface ProcessedData {
  processedMembers: ProcessedMember[];
  totalGroupFoodExpenses: number;
  totalGroupOtherExpenses: number;
  totalGroupMeals: number;
  memberCount: number;
  mealRate: number;
  totalGroupExpenses: number;
  totalUtilityExpenses: number;
  otherExpensesList: Expense[];
}

// Reusable utility functions
const sortByDateDesc = (a: { date: Date | Timestamp }, b: { date: Date | Timestamp }) => {
  const dateA = a.date instanceof Date ? a.date.getTime() : (a.date as Timestamp)?.toMillis();
  const dateB = b.date instanceof Date ? b.date.getTime() : (b.date as Timestamp)?.toMillis();
  return (dateB || 0) - (dateA || 0);
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full rounded-lg" />
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
                  <TableHead className="text-center w-12">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {member.memberUtilityExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatShortDateSafe(expense.date)}</TableCell>
                    <TableCell><Badge variant="outline">{expense.category}</Badge></TableCell>
                    <TableCell className="text-right">৳{(expense.amount || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      {expense.receiptPhotoUrl ? (
                        <Suspense fallback={<Skeleton className="h-7 w-7" />}>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <Receipt className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                  <DialogTitle>Receipt for {expense.expenseItem}</DialogTitle>
                              </DialogHeader>
                              <div className="py-4">
                                  <img src={expense.receiptPhotoUrl} alt="Receipt" className="w-full h-auto rounded-md" />
                              </div>
                            </DialogContent>
                          </Dialog>
                        </Suspense>
                      ) : <span className="text-xs">-</span>}
                    </TableCell>
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

export function MonthlySummary() {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading, error: currentUserDataError } = useDoc(currentUserRef);

  const groupId = currentUserData?.groupId;

  const monthDateRange = useMemo(() => {
    return {
      start: Timestamp.fromDate(startOfMonth(currentMonth)),
      end: Timestamp.fromDate(endOfMonth(currentMonth)),
    };
  }, [currentMonth]);

  // Existing queries
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

  // NEW: Query to fetch ALL users
  const usersQuery = useMemo(() =>
    collection(firestore, "users"),
    [firestore]
  );

  // Existing data fetches
  const { data: membersData, isLoading: areMembersLoading, error: membersError } = useCollection(membersQuery);
  const { data: mealsData, isLoading: areMealsLoading, error: mealsError } = useCollection<MealLog>(mealsQuery);
  const { data: expensesData, isLoading: areExpensesLoading, error: expensesError } = useCollection<Expense>(expensesQuery);
  
  // NEW: Fetch all users data
  const { data: usersData, isLoading: areUsersLoading, error: usersError } = useCollection(usersQuery);

  const isAnyLoading = isCurrentUserLoading || isCurrentUserDataLoading || (!!groupId && (areMembersLoading || areMealsLoading || areExpensesLoading || areUsersLoading));
  const hasAnyErrors = currentUserDataError || membersError || mealsError || expensesError || usersError;

  const handleMonthChange = (direction: "next" | "prev") => {
    setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  }

  const processedData = useMemo((): ProcessedData | null => {
    if (!membersData || !mealsData || !expensesData || !usersData) {
      return null;
    }

    // STEP 1: Create User Map (lookup object)
    const userMap = usersData.reduce((acc, userDoc) => {
      acc[userDoc.id] = {
        displayName: userDoc.displayName,
        photoURL: userDoc.photoURL,
        email: userDoc.email
      };
      return acc;
    }, {} as Record<string, { displayName?: string; photoURL?: string; email?: string }>);

    const mealsByUser = mealsData.reduce((acc, meal) => {
      acc[meal.userId] = [...(acc[meal.userId] || []), meal];
      return acc;
    }, {} as Record<string, MealLog[]>);

    const expensesByUser = expensesData.reduce((acc, expense) => {
      acc[expense.userId] = [...(acc[expense.userId] || []), expense];
      return acc;
    }, {} as Record<string, Expense[]>);

    // STEP 2: Process members with user data lookup
    const processedMembers = membersData.map(member => {
      // STEP 3: Look up user details from the user map
      const userDetails = userMap[member.id];
      
      const memberMeals = (mealsByUser[member.id] || []).sort(sortByDateDesc);
      const memberExpenses = (expensesByUser[member.id] || []);

      const totalMeals = memberMeals.reduce((sum, meal) => sum + (meal.mealNumber || 1), 0);
      
      const foodExpenses = memberExpenses
        .filter(e => e.category === 'Food & Groceries')
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      
      const otherExpenses = memberExpenses
        .filter(e => e.category === 'Other')
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      
      const memberUtilityExpenses = memberExpenses
        .filter(e => e.category === 'Electricity' || e.category === 'Gas')
        .sort(sortByDateDesc);
      
      const utilityExpensesPaid = memberUtilityExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      
      const totalPaid = memberExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      return {
        id: member.id,
        // STEP 4: Use user data from the map instead of member data
        name: userDetails?.displayName || userDetails?.email?.split('@')[0] || 'Unnamed Member',
        photoURL: userDetails?.photoURL,
        meals: totalMeals,
        memberMeals,
        foodExpenses,
        otherExpenses,
        utilityExpensesPaid,
        memberUtilityExpenses,
        totalPaid,
      } as ProcessedMember;
    });

    const totalGroupFoodExpenses = processedMembers.reduce((acc, member) => acc + (member.foodExpenses || 0), 0);
    const totalGroupOtherExpenses = processedMembers.reduce((acc, member) => acc + (member.otherExpenses || 0), 0);
    const totalGroupMeals = processedMembers.reduce((acc, member) => acc + (member.meals || 0), 0);
    const memberCount = processedMembers.length > 0 ? processedMembers.length : 1;
    const mealRate = totalGroupMeals > 0 ? totalGroupFoodExpenses / totalGroupMeals : 0;
    const totalUtilityExpenses = expensesData.filter(e => e.category === 'Electricity' || e.category === 'Gas').reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalGroupExpenses = expensesData.reduce((sum, e) => sum + (e.amount || 0), 0);
    const otherExpensesList = expensesData.filter(e => e.category === 'Other').sort(sortByDateDesc);

    return {
      processedMembers,
      totalGroupFoodExpenses,
      totalGroupOtherExpenses,
      totalGroupMeals,
      memberCount,
      mealRate: mealRate || 0,
      totalGroupExpenses: totalGroupExpenses || 0,
      totalUtilityExpenses: totalUtilityExpenses || 0,
      otherExpensesList
    };
  }, [membersData, mealsData, expensesData, usersData]);

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
      totalGroupOtherExpenses,
      totalGroupMeals,
      memberCount,
      mealRate,
      totalGroupExpenses,
      totalUtilityExpenses,
      otherExpensesList
  } = processedData;

  const perMemberUtilityShare = totalUtilityExpenses / (memberCount || 1);
  const perMemberOtherShare = totalGroupOtherExpenses / (memberCount || 1);
  

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold">Monthly Summary</h2>
                <p className="text-muted-foreground">An overview of your group's activity for the selected month.</p>
            </div>
            <MonthSwitcher 
                currentDate={currentMonth}
                onMonthChange={handleMonthChange}
            />
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Utensils/> Food & Meals</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
               <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Food & Groceries</p>
                  <p className="text-2xl font-bold">৳{(totalGroupFoodExpenses || 0).toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Meals</p>
                  <p className="text-2xl font-bold">{totalGroupMeals || 0}</p>
                </div>
               </div>
            </CardContent>
            <CardContent>
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium text-primary/80">Calculated Meal Rate</p>
                  <p className="text-3xl font-bold text-primary">৳{(mealRate || 0).toFixed(2)} / meal</p>
              </div>
            </CardContent>
        </Card>
        
       <Card className="flex flex-col">
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
       <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package/> Other Expenses</CardTitle>
                 <CardDescription>A summary of other expenses.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total "Other" Expenses</p>
                  <p className="text-2xl font-bold">৳{(totalGroupOtherExpenses || 0).toFixed(0)}</p>
                </div>
                 <Collapsible>
                    <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full group">
                            Show Breakdown 
                            <ChevronDown className="h-4 w-4 ml-2 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                        {otherExpensesList.length > 0 ? (
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-center">Receipt</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {otherExpensesList.map(expense => {
                                      const userDetails = processedMembers.find(m => m.id === expense.userId);
                                      return (
                                        <TableRow key={expense.id}>
                                            <TableCell>{formatShortDateSafe(expense.date)}</TableCell>
                                            <TableCell>{userDetails?.name || 'Unknown Member'}</TableCell>
                                            <TableCell>{expense.expenseItem}</TableCell>
                                            <TableCell className="text-right">৳{expense.amount.toFixed(2)}</TableCell>
                                            <TableCell className="text-center">
                                                {expense.receiptPhotoUrl ? (
                                                  <Suspense fallback={<Skeleton className="h-7 w-7"/>}>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                <Receipt className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-3xl">
                                                            <DialogHeader>
                                                                <DialogTitle>Receipt for {expense.expenseItem}</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="py-4">
                                                                <img src={expense.receiptPhotoUrl} alt="Receipt" className="w-full h-auto rounded-md" />
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                  </Suspense>
                                                ) : <span className="text-xs">-</span>}
                                            </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                </TableBody>
                           </Table>
                        ) : (
                            <div className="text-center text-muted-foreground py-4 text-sm">
                                No "Other" expenses logged for this month.
                            </div>
                        )}
                    </CollapsibleContent>
                 </Collapsible>
            </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Scale /> Final Settlement
            </CardTitle>
            <CardDescription>
                A breakdown of expenses, contributions, and balances for each member.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {processedMembers.map(member => {
              const totalMealCost = member.meals * mealRate;
              const memberShare = totalMealCost + perMemberUtilityShare + perMemberOtherShare;
              const balance = member.totalPaid - memberShare;

              return (
                <Collapsible key={member.id} className="border rounded-lg bg-card group">
                  <div className="flex flex-col md:flex-row items-start md:items-center p-4 gap-4">
                      <div className="flex items-center gap-3 flex-1">
                          <Avatar>
                            <AvatarImage src={member.photoURL}/>
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{member.name}</p>
                            <div className={cn(
                                "font-bold text-xl",
                                balance >= 0 ? 'text-green-600' : 'text-red-600'
                              )}>
                              {balance >= 0 ? `Gets: ` : `Owes: `}
                              ৳{Math.abs(balance).toFixed(2)}
                            </div>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-none md:flex md:items-center gap-x-4 gap-y-2 text-sm w-full md:w-auto">
                        <div className="text-center">
                          <p className="text-muted-foreground">Total Paid</p>
                          <p className="font-medium">৳{member.totalPaid.toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Total Share</p>
                          <p className="font-medium">৳{memberShare.toFixed(2)}</p>
                        </div>
                        <CollapsibleTrigger asChild className="col-span-2 md:col-span-1">
                          <Button variant="ghost" className="w-full md:w-auto group-data-[state=open]:bg-accent">
                            View Details 
                            <ChevronDown className="h-4 w-4 ml-2 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                  </div>
                  <CollapsibleContent>
                    <div className="border-t bg-muted/50 p-4">
                      <h4 className="font-semibold mb-3">Details for {member.name}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="p-3 bg-background rounded-lg border">
                          <p className="text-muted-foreground">Total Meals</p>
                          <p className="font-bold text-lg">{member.meals}</p>
                        </div>
                        <div className="p-3 bg-background rounded-lg border">
                          <p className="text-muted-foreground">Food Contribution</p>
                          <p className="font-bold text-lg">৳{member.foodExpenses.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-background rounded-lg border">
                          <p className="text-muted-foreground">Utility Contribution</p>
                          <p className="font-bold text-lg">৳{member.utilityExpensesPaid.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-background rounded-lg border">
                          <p className="text-muted-foreground">Other Contribution</p>
                          <p className="font-bold text-lg">৳{member.otherExpenses.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </CardContent>
          <CardFooter className="bg-muted/50 p-4 border-t rounded-b-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full text-center">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Food Cost</p>
                        <p className="font-bold text-lg">৳{totalGroupFoodExpenses.toFixed(2)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Total Utility Cost</p>
                        <p className="font-bold text-lg">৳{totalUtilityExpenses.toFixed(2)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Total Other Cost</p>
                        <p className="font-bold text-lg">৳{totalGroupOtherExpenses.toFixed(2)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Grand Total</p>
                        <p className="font-bold text-lg text-primary">৳{totalGroupExpenses.toFixed(2)}</p>
                    </div>
                </div>
          </CardFooter>
      </Card>
    </div>
  );
}



    