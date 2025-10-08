
"use client";

import { useMemo, useState } from "react";
import { useUser, useDoc, useCollection, useFirebase } from "@/firebase";
import { doc, collection, query, where, Timestamp } from "firebase/firestore";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import type { MealLog, Purchase } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Utensils, ShoppingCart, LeafyGreen } from "lucide-react";
import { MonthSwitcher } from "../month-switcher";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
    const purchasesQuery = useMemo(() => (groupId ? query(collection(firestore, `groups/${groupId}/purchases`), where("date", ">=", monthDateRange.start), where("date", "<=", monthDateRange.end)) : null), [firestore, groupId, monthDateRange]);

    const { data: members, isLoading: areMembersLoading } = useCollection(membersQuery);
    const { data: meals, isLoading: areMealsLoading } = useCollection<MealLog>(mealsQuery);
    const { data: purchases, isLoading: arePurchasesLoading } = useCollection<Purchase>(purchasesQuery);

    const handleMonthChange = (direction: "next" | "prev") => {
        setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
    }

    const activitiesByMember = useMemo(() => {
        if (!members || !meals || !purchases) return [];
        return members.map(member => {
            const memberMeals = meals.filter(meal => meal.userId === member.id);
            const memberPurchases = purchases.filter(purchase => purchase.userId === member.id && purchase.cost > 0);
            
            const totalMealCount = memberMeals.reduce((sum, meal) => sum + meal.mealNumber, 0);
            const totalFoodExpenses = memberPurchases.reduce((sum, p) => sum + p.cost, 0);

            const mealsByDate = memberMeals.reduce((acc, meal) => {
                const dateStr = format((meal.date as Timestamp).toDate(), 'yyyy-MM-dd');
                if (!acc[dateStr]) {
                    acc[dateStr] = { date: dateStr, meals: [] };
                }
                acc[dateStr].meals.push(meal);
                return acc;
            }, {} as Record<string, { date: string, meals: MealLog[] }>);

            const sortedMealsByDate = Object.values(mealsByDate).sort((a,b) => b.date.localeCompare(a.date));
            const sortedPurchases = memberPurchases.sort((a,b) => (b.date as any).toMillis() - (a.date as any).toMillis());

            return {
                ...member,
                displayName: member.displayName || member.email?.split('@')[0] || 'Unnamed Member',
                totalMealCount,
                totalFoodExpenses,
                dailyMeals: sortedMealsByDate,
                monthlyPurchases: sortedPurchases,
            }
        });
    }, [members, meals, purchases]);

    const isLoading = isCurrentUserLoading || isCurrentUserDataLoading || areMembersLoading || areMealsLoading || arePurchasesLoading;

    if (isLoading) {
        return <ReportSkeleton />
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                    <h2 className="text-2xl font-bold">Monthly Meal Report</h2>
                    <p className="text-muted-foreground">Detailed meal and food purchase report for each member.</p>
                </div>
                <MonthSwitcher currentDate={currentMonth} onMonthChange={handleMonthChange} />
            </div>

            <div className="grid grid-cols-1 gap-4">
                {activitiesByMember.map(member => (
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
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                            <span>
                                                Total Meals: <span className="font-semibold text-primary">{member.totalMealCount}</span>
                                            </span>
                                             <span>
                                                Food Expenses: <span className="font-semibold text-primary">৳{member.totalFoodExpenses.toFixed(2)}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <CollapsibleTrigger asChild>
                                    <Button variant="outline" className="mt-4 md:mt-0 w-full md:w-auto">
                                        View Daily Activity <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </CollapsibleTrigger>
                             </div>
                             <CollapsibleContent>
                                <div className="px-4 pb-4 space-y-6">
                                    {/* Daily Meal Section */}
                                    <div>
                                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><Utensils /> Daily Meal Log</h3>
                                        {member.dailyMeals.length > 0 ? (
                                            member.dailyMeals.map(day => (
                                                <div key={day.date} className="mt-2 p-3 border rounded-lg bg-muted/50">
                                                    <h4 className="font-semibold mb-2">{format(new Date(day.date), "MMMM d, yyyy")}</h4>
                                                    <div className="space-y-1 text-sm">
                                                        {day.meals.map(meal => (
                                                            <div key={meal.id} className="flex justify-between items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="secondary" className="capitalize w-24 justify-center">{meal.mealType}</Badge>
                                                                    <span>{meal.itemName || `Meal Log`}</span>
                                                                </div>
                                                                <span>x {meal.mealNumber}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 text-muted-foreground">
                                                <LeafyGreen className="h-8 w-8 mx-auto mb-2" />
                                                <p>No meals logged by {member.displayName} this month.</p>
                                            </div>
                                        )}
                                    </div>

                                    <Separator />
                                    
                                    {/* Monthly Purchases Section */}
                                    <div>
                                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><ShoppingCart /> Monthly Food Purchases</h3>
                                        {member.monthlyPurchases.length > 0 ? (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Item Name</TableHead>
                                                        <TableHead>Qty</TableHead>
                                                        <TableHead className="text-right">Cost</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {member.monthlyPurchases.map(purchase => (
                                                        <TableRow key={purchase.id}>
                                                            <TableCell>{format(purchase.date.toDate(), 'MMM dd')}</TableCell>
                                                            <TableCell>{purchase.itemName}</TableCell>
                                                            <TableCell>{purchase.quantity} {purchase.unit}</TableCell>
                                                            <TableCell className="text-right">৳{purchase.cost.toFixed(2)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                             <div className="text-center py-6 text-muted-foreground">
                                                <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
                                                <p>No food items purchased by {member.displayName} this month.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                             </CollapsibleContent>
                        </Collapsible>
                     </Card>
                ))}
            </div>
        </div>
    )

    