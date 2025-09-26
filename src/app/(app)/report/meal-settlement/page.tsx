
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Utensils, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { getMonthlyGroupData } from "@/ai/flows/get-monthly-group-data";
import type { MonthlyGroupData } from "@/ai/schemas";
import { Skeleton } from "@/components/ui/skeleton";

function MealSettlementSkeleton() {
  return (
     <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
        </div>
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Utensils className="h-5 w-5"/>
                        <Skeleton className="h-6 w-56" />
                    </span>
                    <div className="text-right">
                        <p className="text-sm font-medium text-primary">Meal Rate</p>
                        <Skeleton className="h-7 w-24 mt-1" />
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-48 w-full" />
            </CardContent>
        </Card>
    </div>
  )
}


export default function MealSettlementPage() {
    const searchParams = useSearchParams();
    const monthParam = searchParams.get('month');
    const targetDate = monthParam ? parseISO(monthParam) : new Date();

    const { firestore } = useFirebase();
    const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();

    const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);
    const groupId = currentUserData?.groupId;

    const [groupData, setGroupData] = useState<MonthlyGroupData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (groupId) {
            setIsLoading(true);
            getMonthlyGroupData({ groupId, date: targetDate.toISOString() })
                .then(data => {
                    setGroupData(data);
                    setError(null);
                })
                .catch(err => {
                    console.error("Failed to fetch monthly data:", err);
                    setError("Could not load settlement data.");
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else if (!isCurrentUserLoading && !isCurrentUserDataLoading) {
            setIsLoading(false);
        }
    }, [groupId, targetDate, isCurrentUserLoading, isCurrentUserDataLoading]);

    const dataLoading = isLoading || isCurrentUserLoading || isCurrentUserDataLoading;

    if (dataLoading) {
        return <MealSettlementSkeleton />;
    }
    
    if (error) {
        return <Card><CardContent><p className="text-center text-destructive py-8">{error}</p></CardContent></Card>;
    }

    const members = groupData?.members ?? [];
    const hasMembers = members.length > 0;
    const totalGroupFoodExpenses = members.reduce((acc, member) => acc + member.expenses.food, 0);
    const totalGroupMeals = members.reduce((acc, member) => acc + member.meals, 0);
    const mealRate = totalGroupFoodExpenses > 0 && totalGroupMeals > 0 ? totalGroupFoodExpenses / totalGroupMeals : 0;
    const monthQueryParam = format(targetDate, 'yyyy-MM-dd');

    const settlementData = members.map(member => {
      const mealShare = member.meals * mealRate;
      const mealBalance = member.expenses.food - mealShare;
      return {
        ...member,
        mealShare,
        mealBalance,
      };
    });

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href={`/report?month=${monthQueryParam}`}><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline">
                Monthly Meal Settlement
              </h1>
              <p className="text-muted-foreground">
                Breakdown of meal costs for {format(targetDate, "MMMM yyyy")}.
              </p>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Utensils className="h-5 w-5"/>
                        Meal Contribution per Member
                    </span>
                    <div className="text-right">
                        <p className="text-sm font-medium text-primary">Meal Rate</p>
                        <p className="text-xl font-bold text-primary">৳{mealRate.toFixed(2)}</p>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead className="text-center">Meals</TableHead>
                        <TableHead className="text-right">Food Paid</TableHead>
                        <TableHead className="text-right">Meal Share</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hasMembers ? settlementData.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            <Link href={`/report/${member.id}?month=${monthQueryParam}`} className="hover:underline text-primary">
                              {member.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-center">{member.meals}</TableCell>
                          <TableCell className="text-right">৳{member.expenses.food.toFixed(2)}</TableCell>
                          <TableCell className="text-right">৳{member.mealShare.toFixed(2)}</TableCell>
                          <TableCell className={cn(
                            "text-right font-medium",
                            member.mealBalance >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {member.mealBalance >= 0 ? `+৳${member.mealBalance.toFixed(2)}` : `-৳${Math.abs(member.mealBalance).toFixed(2)}`}
                          </TableCell>
                        </TableRow>
                      )) : (
                         <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                               <div className="flex flex-col items-center gap-2">
                                   <Users className="h-8 w-8 text-muted-foreground" />
                                   <p className="text-muted-foreground">No members in this group for the selected month.</p>
                                </div>
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
