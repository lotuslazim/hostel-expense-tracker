
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Flame, Zap, Utensils, Scale, Loader2, Users } from "lucide-react";
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getMonthlyGroupData } from "@/ai/flows/get-monthly-group-data";
import type { MonthlyGroupData } from "@/ai/schemas";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface MonthlySummaryProps {
  month: Date;
}

function SummarySkeleton() {
  return (
    <Card className="max-w-5xl mx-auto">
      <CardContent className="space-y-8 pt-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Overall Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium my-4 flex items-center gap-2"><Scale/> Final Settlement</h3>
          <Skeleton className="h-40 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}


export function MonthlySummary({ month }: MonthlySummaryProps) {
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
      getMonthlyGroupData({ groupId, date: month.toISOString() })
        .then(data => {
          setGroupData(data);
          setError(null);
        })
        .catch(err => {
          console.error("Failed to fetch monthly data:", err);
          setError("Could not load monthly report data.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!isCurrentUserLoading && !isCurrentUserDataLoading) {
      setIsLoading(false);
    }
  }, [groupId, month, isCurrentUserLoading, isCurrentUserDataLoading]);

  const dataLoading = isLoading || isCurrentUserLoading || isCurrentUserDataLoading;

  if (dataLoading) {
    return <SummarySkeleton />;
  }

  if (error) {
    return <Card><CardContent><p className="text-center text-destructive py-8">{error}</p></CardContent></Card>;
  }

  const members = groupData?.members ?? [];
  const hasMembers = members.length > 0;
  
  const totalGroupFoodExpenses = members.reduce((acc, member) => acc + member.expenses.food, 0);
  const totalGroupElectricity = members.reduce((acc, member) => acc + member.expenses.electricity, 0);
  const totalGroupGas = members.reduce((acc, member) => acc + member.expenses.gas, 0);
  const totalGroupUtilities = totalGroupElectricity + totalGroupGas;
  const totalGroupMeals = members.reduce((acc, member) => acc + member.meals, 0);
  const memberCount = members.length;
  const utilitySharePerMember = memberCount > 0 ? totalGroupUtilities / memberCount : 0;
  
  const monthQueryParam = format(month, 'yyyy-MM-dd');

  return (
    <div className="space-y-8">
      <Card className="max-w-5xl mx-auto">
        <CardContent className="space-y-8 pt-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Overall Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <Link href="/report/items" className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1 whitespace-nowrap"><span className="font-bold text-lg">৳</span> Total Food</p>
                <p className="text-2xl font-bold">৳{totalGroupFoodExpenses.toFixed(2)}</p>
              </Link>
              <Link href="/report/contribution/electricity" className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1 whitespace-nowrap"><Zap /> Total Electricity</p>
                <p className="text-2xl font-bold">৳{totalGroupElectricity.toFixed(2)}</p>
              </Link>
              <Link href="/report/contribution/gas" className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1 whitespace-nowrap"><Flame /> Total Gas</p>
                <p className="text-2xl font-bold">৳{totalGroupGas.toFixed(2)}</p>
              </Link>
              <Link href="/report/meal-settlement" className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1 whitespace-nowrap"><Utensils /> Total Meals</p>
                <p className="text-2xl font-bold">{totalGroupMeals}</p>
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium my-4 flex items-center gap-2"><Scale/> Final Settlement</h3>
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead className="text-right">Total Spend</TableHead>
                    <TableHead className="text-right">Final Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hasMembers ? members.map((member) => {
                    const mealRate = totalGroupFoodExpenses > 0 && totalGroupMeals > 0 ? totalGroupFoodExpenses / totalGroupMeals : 0;
                    const mealShare = member.meals * mealRate;
                    const mealBalance = member.expenses.food - mealShare;
                    const utilityPaid = member.expenses.electricity + member.expenses.gas;
                    const utilityBalance = utilityPaid - utilitySharePerMember;
                    const finalBalance = mealBalance + utilityBalance;
                    const totalExpenses = member.expenses.food + utilityPaid;

                    return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <Link href={`/report/${member.id}?month=${monthQueryParam}`} className="hover:underline text-primary">
                          {member.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ৳{totalExpenses.toFixed(2)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-bold",
                        finalBalance >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {finalBalance >= 0 ? `Gets Back: ৳${finalBalance.toFixed(2)}` : `Owes: ৳${Math.abs(finalBalance).toFixed(2)}`}
                      </TableCell>
                    </TableRow>
                  )}) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24">
                        <div className="flex flex-col items-center gap-2">
                           <Users className="h-8 w-8 text-muted-foreground" />
                           <p className="text-muted-foreground">No members in this group for the selected month.</p>
                           {!groupId && <p className="text-sm text-muted-foreground">Go to the Admin page to create or join a group.</p>}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
