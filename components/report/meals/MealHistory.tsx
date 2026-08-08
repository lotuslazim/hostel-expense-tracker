
"use client";

import { useMemo } from 'react';
import { useCollection } from '@/firebase';
import { firestore } from '@/firebase/config';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Utensils, ListChecks } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import type { MealLog } from '@/lib/types';

interface MealHistoryProps {
    userId: string;
    groupId: string;
}

function MealHistorySkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-5 w-8" />
                </div>
            ))}
        </div>
    );
}

export function MealHistory({ userId, groupId }: MealHistoryProps) {
    const recentMealsQuery = useMemo(() => {
        if (!userId || !groupId) return null;
        return query(
            collection(firestore, `groups/${groupId}/meals`),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
    }, [userId, groupId]);

    const { data: meals, isLoading } = useCollection<MealLog>(recentMealsQuery);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListChecks /> Recent Meal History</CardTitle>
                <CardDescription>Your last 5 logged meals.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-64">
                    {isLoading ? (
                        <MealHistorySkeleton />
                    ) : meals && meals.length > 0 ? (
                        <div className="space-y-4">
                            {meals.map(meal => (
                                <div key={meal.id} className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="capitalize w-20 justify-center">{meal.mealType}</Badge>
                                            <p className="font-semibold">{meal.itemName || 'Meal'}</p>
                                        </div>
                                        {meal.createdAt && (
                                            <p className="text-xs text-muted-foreground ml-1 mt-1">
                                                {formatDistanceToNow((meal.createdAt as Timestamp).toDate(), { addSuffix: true })}
                                            </p>
                                        )}
                                    </div>
                                    <p className="font-bold text-primary text-lg">x{meal.mealNumber}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
                            <Utensils className="h-10 w-10 mb-2" />
                            <p>No meals logged yet.</p>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
