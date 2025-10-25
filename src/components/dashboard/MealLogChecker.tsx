
"use client";

import { useMemo, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ListChecks } from 'lucide-react';
import { startOfDay, endOfDay, isToday } from 'date-fns';
import { format } from 'date-fns/format';

interface MealLogCheckerProps {
    userId: string;
    groupId: string;
    mealTypes: string[];
    isLoading: boolean;
    selectedDate: Date;
}

function MealCheckerSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListChecks /> Meal Log Status</CardTitle>
                <CardDescription>Checking your meal status...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <div className="space-y-3 pt-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}

export function MealLogChecker({ userId, groupId, mealTypes, isLoading: isMealTypesLoading, selectedDate }: MealLogCheckerProps) {
    const [summary, setSummary] = useState<Record<string, number>>({});
    const [isMealDataLoading, setIsMealDataLoading] = useState(true);

    const mealTypesToCheck = useMemo(() => mealTypes.map(t => t.toLowerCase()), [mealTypes]);
    const dateKey = selectedDate.toISOString().split('T')[0];

    useEffect(() => {
        if (!userId || !groupId) {
            setIsMealDataLoading(false);
            return;
        };

        setIsMealDataLoading(true);
        const dayStart = startOfDay(selectedDate);
        const dayEnd = endOfDay(selectedDate);

        const q = query(
            collection(firestore, `groups/${groupId}/meals`),
            where('userId', '==', userId),
            where('date', '>=', Timestamp.fromDate(dayStart)),
            where('date', '<=', Timestamp.fromDate(dayEnd))
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const initialCounts = mealTypesToCheck.reduce((acc, type) => ({ ...acc, [type]: 0 }), {});
            const mealCounts: Record<string, number> = snapshot.docs.reduce((acc, doc) => {
                 const meal = doc.data();
                 const mealType = meal.mealType.toLowerCase();
                if (acc.hasOwnProperty(mealType)) {
                    acc[mealType] += meal.mealNumber;
                }
                return acc;
            }, initialCounts);
            
            setSummary(mealCounts);
            setIsMealDataLoading(false);
        }, (error) => {
            console.error("Error fetching meal logs:", error);
            setIsMealDataLoading(false);
        });

        return () => unsubscribe();
    }, [userId, groupId, mealTypesToCheck, dateKey]); // Use dateKey for stable dependency

    const isLoading = isMealTypesLoading || isMealDataLoading;

    if (isLoading) {
        return <MealCheckerSkeleton />;
    }
    
    const loggedMealTypesCount = mealTypesToCheck.filter(type => (summary[type] || 0) > 0).length;
    const progress = mealTypesToCheck.length > 0 ? (loggedMealTypesCount / mealTypesToCheck.length) * 100 : 0;
    const totalMealsLogged = Object.values(summary).reduce((sum, count) => sum + count, 0);

    const titleText = isToday(selectedDate) ? "Today's Meal Log Status" : `Status for ${format(selectedDate, 'MMM d')}`;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListChecks /> {titleText}</CardTitle>
                <CardDescription>
                    {totalMealsLogged > 0 
                        ? `You’ve logged ${totalMealsLogged} meals for this day.`
                        : "You haven't logged any meals for this day."
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Progress value={progress} className="h-2" />
                <div className="space-y-3">
                    {mealTypesToCheck.length > 0 ? mealTypesToCheck.map(mealType => {
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
                    }) : (
                        <p className="text-sm text-center text-muted-foreground py-4">No meal types configured for this group.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
