"use client";

import { useMemo, useState } from "react";
import { useUser, useDoc, useCollection, useFirebase } from "@/firebase";
import { doc, collection, query, where, Timestamp } from "firebase/firestore";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import type { MealLog } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Utensils } from "lucide-react";
import { MonthSwitcher } from "../month-switcher";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function ReportSkeleton() {
    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 gap-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                            <Skeleton className="h-10 w-36" />
                        </CardHeader>
                    </Card>
                ))}
             </div>
        </div>
    )
}

interface ProcessedMeal {
    date: string;
    meals: MealLog[];
}

export function MealConsumptionReport() {
    const { firestore } = useFirebase();
    const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

    const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);

    const groupId = currentUserData?.groupId;

    const monthDateRange = useMemo(() => {
        return {
        start: Timestamp.fromDate(startOfMonth(currentMonth)),
        end: Timestamp.fromDate(endOfMonth(currentMonth)),
        };
    }, [currentMonth]);

    const membersQuery = useMemo(() => (groupId ? collection(firestore, `groups/${groupId}/members`) : null), [firestore, groupId]);
    const mealsQuery = useMemo(() => (groupId ? query(collection(firestore, `groups/${groupId}/meals`), where("date", ">=", monthDateRange.start), where("date", "<=", monthDateRange.end)) : null), [firestore, groupId, monthDateRange]);

    const { data: members, isLoading: areMembersLoading } = useCollection(membersQuery);
    const { data: meals, isLoading: areMealsLoading } = useCollection<MealLog>(mealsQuery);

    const handleMonthChange = (direction: "next" | "prev") => {
        setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
    }

    const mealsByMember = useMemo(() => {
        if (!members || !meals) return [];
        return members.map(member => {
            const memberMeals = meals.filter(meal => meal.userId === member.id);
            const totalMealCount = memberMeals.reduce((sum, meal) => sum + meal.mealNumber, 0);

            const mealsByDate = memberMeals.reduce((acc, meal) => {
                const dateStr = format((meal.date as Timestamp).toDate(), 'yyyy-MM-dd');
                if (!acc[dateStr]) {
                    acc[dateStr] = { date: dateStr, meals: [] };
                }
                acc[dateStr].meals.push(meal);
                return acc;
            }, {} as Record<string, ProcessedMeal>);

            const sortedMealsByDate = Object.values(mealsByDate).sort((a,b) => b.date.localeCompare(a.date));

            return {
                ...member,
                totalMealCount,
                dailyMeals: sortedMealsByDate
            }
        });
    }, [members, meals]);

    const isLoading = isCurrentUserLoading || areMembersLoading || areMealsLoading;

    if (isLoading) {
        return <ReportSkeleton />
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                    <h2 className="text-2xl font-bold">Monthly Meal Report</h2>
                    <p className="text-muted-foreground">Detailed meal consumption for each group member.</p>
                </div>
                <MonthSwitcher currentDate={currentMonth} onMonthChange={handleMonthChange} />
            </div>

            <div className="grid grid-cols-1 gap-4">
                {mealsByMember.map(member => (
                     <Card key={member.id}>
                        <Collapsible>
                             <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={member.photoURL} alt={member.displayName} />
                                        <AvatarFallback>{member.displayName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-lg">{member.displayName}</p>
                                        <p className="text-muted-foreground">
                                            Total Meals: <span className="font-semibold text-primary">{member.totalMealCount}</span>
                                        </p>
                                    </div>
                                </div>
                                <CollapsibleTrigger asChild>
                                    <Button variant="outline" className="mt-4 md:mt-0 w-full md:w-auto">
                                        View Daily Meals <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </CollapsibleTrigger>
                             </div>
                             <CollapsibleContent>
                                <div className="px-4 pb-4">
                                    {member.dailyMeals.length > 0 ? (
                                        member.dailyMeals.map(day => (
                                            <div key={day.date} className="mt-4 p-4 border rounded-lg bg-muted/50">
                                                <h4 className="font-semibold mb-2">{format(new Date(day.date), "MMMM d, yyyy")}</h4>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Type</TableHead>
                                                            <TableHead>Count</TableHead>
                                                            <TableHead>Item Name</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                     <TableBody>
                                                        {day.meals.map(meal => (
                                                            <TableRow key={meal.id}>
                                                                <TableCell><Badge variant="secondary" className="capitalize">{meal.mealType}</Badge></TableCell>
                                                                <TableCell>{meal.mealNumber}</TableCell>
                                                                <TableCell>{meal.itemName || 'N/A'}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Utensils className="h-8 w-8 mx-auto mb-2" />
                                            <p>No meals logged by {member.displayName} this month.</p>
                                        </div>
                                    )}
                                </div>
                             </CollapsibleContent>
                        </Collapsible>
                     </Card>
                ))}
            </div>
        </div>
    )
}
