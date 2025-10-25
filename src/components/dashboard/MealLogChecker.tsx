
"use client";

import { useMemo, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ListChecks } from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';

interface MealLogCheckerProps {
    userId: string;
    groupId: string;
}

const MEAL_TYPES_TO_CHECK = ["breakfast", "lunch", "dinner"];

function MealCheckerSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListChecks /> Today's Meal Log Checker</CardTitle>
                <CardDescription>Checking your meal status...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <div className="space-y-3 pt-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}

export function MealLogChecker({ userId, groupId }: MealLogCheckerProps) {
    const [summary, setSummary] = useState<Record<string, number>>({ breakfast: 0, lunch: 0, dinner: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId || !groupId) {
            setIsLoading(false);
            return;
        };

        setIsLoading(true);
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        const q = query(
            collection(firestore, `groups/${groupId}/meals`),
            where('userId', '==', userId),
            where('date', '>=', Timestamp.fromDate(todayStart)),
            where('date', '<=', Timestamp.fromDate(todayEnd))
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const mealCounts: Record<string, number> = { breakfast: 0, lunch: 0, dinner: 0 };
            snapshot.forEach(doc => {
                const meal = doc.data();
                const mealType = meal.mealType.toLowerCase();
                if (mealCounts.hasOwnProperty(mealType)) {
                    mealCounts[mealType] += meal.mealNumber;
                }
            });
            setSummary(mealCounts);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching meal logs:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId, groupId]);

    if (isLoading) {
        return <MealCheckerSkeleton />;
    }
    
    const loggedMealTypesCount = MEAL_TYPES_TO_CHECK.filter(type => summary[type] > 0).length;
    const progress = (loggedMealTypesCount / MEAL_TYPES_TO_CHECK.length) * 100;
    const totalMealsLoggedToday = Object.values(summary).reduce((sum, count) => sum + count, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListChecks /> Today's Meal Log Checker</CardTitle>
                <CardDescription>
                    {totalMealsLoggedToday > 0 
                        ? `You’ve logged ${totalMealsLoggedToday} meals today.`
                        : "You haven't logged any meals today."
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Progress value={progress} className="h-2" />
                <div className="space-y-3">
                    {MEAL_TYPES_TO_CHECK.map(mealType => {
                        const loggedCount = summary[mealType] || 0;
                        const isLogged = loggedCount > 0;
                        return (
                            <div key={mealType} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-3">
                                     {isLogged ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground/50" />
                                    )}
                                    <span className="font-semibold capitalize">{mealType}</span>
                                </div>
                                {isLogged ? (
                                     <span className="text-sm text-muted-foreground">
                                        Logged items: <span className="font-bold text-primary">{loggedCount}</span>
                                    </span>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Not logged</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
