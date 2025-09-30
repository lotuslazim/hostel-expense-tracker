
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { parseISO, startOfMonth, endOfMonth, format, addMonths, subMonths } from "date-fns";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, type Timestamp } from "firebase/firestore";
import type { MealLog } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ChevronLeft, Users, Utensils, ChevronDown } from "lucide-react";
import { WelcomeCard } from "@/components/app/welcome-card";
import { Button } from "@/components/ui/button";
import { MonthSwitcher } from "@/components/report/month-switcher";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Link from "next/link";

// Define a specific type for member data used in this page
interface Member {
  id: string;
  displayName?: string;
  email: string;
}

interface DailyMealInfo {
    day: Date;
    count: number;
}

interface MemberMealInfo {
    id: string;
    name: string;
    totalMeals: number;
    dailyMeals: DailyMealInfo[];
}

function PageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <div>
                        <Skeleton className="h-9 w-72" />
                        <Skeleton className="h-4 w-96 mt-2" />
                    </div>
                </div>
                 <Skeleton className="h-10 w-[330px]" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

function DataError() {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error Loading Data</AlertTitle>
      <AlertDescription>
        There was a problem fetching the meal consumption report. Please try again later.
      </AlertDescription>
    </Alert>
  );
}


export default function MealConsumptionPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const monthParam = searchParams.get('month');

    const currentDate = useMemo(() => {
      if (monthParam) {
        try {
          const parsedDate = parseISO(`${monthParam}-01`);
          if (!isNaN(parsedDate.getTime())) {
            return startOfMonth(parsedDate);
          }
        } catch (e) {
          console.warn("Invalid date in URL, defaulting to current month.", e);
        }
      }
      return startOfMonth(new Date());
    }, [monthParam]);

    const { firestore } = useFirebase();
    const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();
    
    const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserData, isLoading: isCurrentUserDataLoading, error: currentUserDataError } = useDoc(currentUserRef);
    const groupId = currentUserData?.groupId;

    const monthDateRange = useMemo(() => ({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    }), [currentDate]);

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

    const { data: membersData, isLoading: areMembersLoading, error: membersError } = useCollection<Member>(membersQuery);
    const { data: mealsData, isLoading: areMealsLoading, error: mealsError } = useCollection<MealLog>(mealsQuery);

    const processedData: MemberMealInfo[] = useMemo(() => {
        if (!membersData || !mealsData) {
            return [];
        }

        return membersData.map(member => {
            const memberMeals = mealsData.filter(meal => meal.userId === member.id);
            const totalMeals = memberMeals.reduce((sum, meal) => sum + (meal.mealNumber || 1), 0);
            
            const mealCountsByDay = memberMeals.reduce((acc, meal) => {
                const day = format((meal.date as Timestamp).toDate(), 'yyyy-MM-dd');
                if (!acc[day]) {
                    acc[day] = 0;
                }
                acc[day] += meal.mealNumber || 1;
                return acc;
            }, {} as Record<string, number>);

            const dailyMeals = Object.entries(mealCountsByDay)
                .map(([day, count]) => ({ day: parseISO(day), count }))
                .sort((a, b) => a.day.getTime() - b.day.getTime());

            return {
                id: member.id,
                name: member.displayName || member.email.split('@')[0],
                totalMeals,
                dailyMeals,
            };
        });

    }, [mealsData, membersData]);

    const handleMonthChange = (direction: "next" | "prev") => {
        const newDate = direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
        const newUrl = `/report/meals?month=${format(newDate, 'yyyy-MM')}`;
        router.push(newUrl, { scroll: false });
    };

    const isLoading = isCurrentUserLoading || isCurrentUserDataLoading;
    if (isLoading) {
        return <PageSkeleton />;
    }
    
    if (!groupId) {
        return <WelcomeCard />;
    }

    const isDataLoading = areMembersLoading || areMealsLoading;
    const hasError = currentUserDataError || membersError || mealsError;
    
    if (isDataLoading) return <PageSkeleton />;
    if (hasError) return <DataError />;
    
    const monthQueryParam = format(currentDate, 'yyyy-MM');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight font-headline">Meal Consumption Report</h1>
                        <p className="text-muted-foreground">A summary of meals logged by each member in {format(currentDate, "MMMM yyyy")}.</p>
                    </div>
                </div>
                <MonthSwitcher currentDate={currentDate} onMonthChange={handleMonthChange} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Utensils className="h-5 w-5" /> Member Meal Counts</CardTitle>
                    <CardDescription>Total number of meals logged by each member for the month. Click a member for a detailed view.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead className="text-right">Total Meals</TableHead>
                                <TableHead className="w-12 p-0"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {processedData.length > 0 ? processedData.map(member => (
                                <Collapsible asChild key={member.id}>
                                    <>
                                        <TableRow>
                                            <TableCell className="font-medium">
                                                {member.name}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">{member.totalMeals}</TableCell>
                                            <TableCell>
                                                <CollapsibleTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                                        <span className="sr-only">Expand</span>
                                                    </Button>
                                                </CollapsibleTrigger>
                                            </TableCell>
                                        </TableRow>
                                        <CollapsibleContent asChild>
                                            <tr>
                                                <td colSpan={3} className="p-0">
                                                   <div className="p-4 bg-muted/50">
                                                    {member.dailyMeals.length > 0 ? (
                                                      <Table>
                                                          <TableHeader>
                                                              <TableRow>
                                                                  <TableHead>Date</TableHead>
                                                                  <TableHead className="text-right">Total Meals</TableHead>
                                                              </TableRow>
                                                          </TableHeader>
                                                          <TableBody>
                                                              {member.dailyMeals.map(({day, count}) => (
                                                                  <TableRow key={day.toString()}>
                                                                      <TableCell>{format(day, 'MMMM d, yyyy')}</TableCell>
                                                                      <TableCell className="text-right">{count}</TableCell>
                                                                  </TableRow>
                                                              ))}
                                                          </TableBody>
                                                      </Table>
                                                    ) : (
                                                        <p className="text-center text-sm text-muted-foreground py-4">No meals logged by {member.name} this month.</p>
                                                    )}
                                                   </div>
                                                </td>
                                            </tr>
                                        </CollapsibleContent>
                                    </>
                                </Collapsible>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                         <div className="flex flex-col items-center gap-2">
                                            <Users className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-muted-foreground">No meals logged by any member this month.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    )
}
