

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { parseISO, startOfMonth, endOfMonth, format, addMonths, subMonths, isSameDay } from "date-fns";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, Timestamp } from "firebase/firestore";
import type { MealLog } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ChevronLeft, Users, Utensils, ChevronDown, CalendarDays } from "lucide-react";
import { WelcomeCard } from "@/components/app/welcome-card";
import { Button } from "@/components/ui/button";
import { MonthSwitcher } from "@/components/report/month-switcher";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

// Define a specific type for member data used in this page
interface Member {
  id: string;
  displayName?: string;
  email: string;
}

interface DailyMealInfo {
    day: Date;
    totalMeals: number;
    meals: MealLog[];
}

interface MemberMealInfo {
    id: string;
    name: string;
    totalMeals: number;
    dailyData: DailyMealInfo[];
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
                    <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
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
            where("date", ">=", Timestamp.fromDate(monthDateRange.start)),
            where("date", "<=", Timestamp.fromDate(monthDateRange.end))
        ) : null),
        [firestore, groupId, monthDateRange]
    );

    const { data: membersData, isLoading: areMembersLoading, error: membersError } = useCollection<Member>(membersQuery);
    const { data: mealsData, isLoading: areMealsLoading, error: mealsError } = useCollection<MealLog>(mealsQuery);


    const processedData: MemberMealInfo[] = useMemo(() => {
        if (!membersData || !mealsData) {
            return [];
        }

        const mealsByUser = new Map<string, MealLog[]>();
        mealsData.forEach(meal => {
            const userMeals = mealsByUser.get(meal.userId) || [];
            userMeals.push(meal);
            mealsByUser.set(meal.userId, userMeals);
        });

        return membersData.map((member) => {
            const memberMeals = mealsByUser.get(member.id) || [];
            const totalMealsForMonth = memberMeals.reduce((sum, meal) => sum + (meal.mealNumber || 1), 0);
            
            const mealsByDay = memberMeals.reduce((acc, meal) => {
                const dateObj = meal.date instanceof Date 
                    ? meal.date 
                    : (meal.date as Timestamp).toDate();
                const day = format(dateObj, 'yyyy-MM-dd');
                
                if (!acc[day]) {
                    acc[day] = { day: dateObj, totalMeals: 0, meals: [] };
                }
                
                acc[day].totalMeals += meal.mealNumber || 1;
                acc[day].meals.push(meal);
                
                return acc;
            }, {} as Record<string, DailyMealInfo>);

            const dailyData = Object.values(mealsByDay)
                .sort((a, b) => a.day.getTime() - b.day.getTime());

            return {
                id: member.id,
                name: member.displayName || member.email?.split('@')[0] || 'Unknown Member',
                totalMeals: totalMealsForMonth,
                dailyData,
            };
        });

    }, [mealsData, membersData]);

    const handleMonthChange = (direction: "next" | "prev") => {
        const newDate = direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
        const newUrl = `/report/meals?month=${format(newDate, 'yyyy-MM')}`;
        router.push(newUrl, { scroll: false });
    };

    const handleBack = () => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push('/dashboard');
        }
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" onClick={handleBack}>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight font-headline">Meal Consumption Report</h1>
                        <p className="text-muted-foreground">
                            A summary of meals logged by each member in {format(currentDate, "MMMM yyyy")}.
                        </p>
                    </div>
                </div>
                <MonthSwitcher currentDate={currentDate} onMonthChange={handleMonthChange} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" /> 
                        Member Meal Counts
                    </CardTitle>
                    <CardDescription>
                        Total meals for the month. Click to see a detailed daily meal breakdown.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {processedData.length > 0 ? processedData.map(member => (
                            <Collapsible key={member.id} className="border rounded-lg bg-card group">
                                <div className="flex items-center p-4">
                                    <div className="flex-1 space-y-1">
                                        <p className="font-medium text-lg">{member.name}</p>
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <Utensils className="h-4 w-4 text-primary" />
                                            <span className="font-semibold">{member.totalMeals} meals this month</span>
                                        </div>
                                    </div>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="icon" className="ml-2">
                                            <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                            <span className="sr-only">Toggle daily meals</span>
                                        </Button>
                                    </CollapsibleTrigger>
                                </div>
                                
                                <CollapsibleContent>
                                    <div className="p-4 bg-muted/50 border-t">
                                        {member.dailyData.length > 0 ? (
                                            <div className="space-y-4">
                                                <h4 className="font-medium text-sm text-muted-foreground">
                                                    Daily Meal History for {format(currentDate, "MMMM yyyy")}:
                                                </h4>
                                                <div className="space-y-4">
                                                    {member.dailyData.map(({day, totalMeals, meals}) => (
                                                        <div key={day.toString()} className="p-3 bg-background rounded-lg border">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <p className="font-semibold flex items-center gap-2"><CalendarDays className="h-4 w-4" />{format(day, 'EEEE, MMMM d')}</p>
                                                                <Badge>Total meals: {totalMeals}</Badge>
                                                            </div>
                                                            <div className="pl-4 border-l-2 ml-2 space-y-1">
                                                                {meals.map(meal => (
                                                                    <div key={meal.id} className="text-sm">
                                                                        <span className="font-medium">{meal.mealType} ({meal.mealNumber} {meal.mealNumber > 1 ? 'meals' : 'meal'}): </span>
                                                                        <span className="text-muted-foreground">{meal.itemName || 'N/A'}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <Utensils className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                                <p className="text-muted-foreground">
                                                    No meals logged by {member.name} in {format(currentDate, "MMMM yyyy")}.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        )) : (
                            <div className="text-center py-12">
                                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                                    No Data Available
                                </h3>
                                <p className="text-muted-foreground">
                                    No meals have been logged by any member for {format(currentDate, "MMMM yyyy")}.
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
