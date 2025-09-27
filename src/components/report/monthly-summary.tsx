
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Flame, Zap, Utensils, Scale, Loader2, Users, FileText, Bot } from "lucide-react";
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getMonthlyGroupData } from "@/ai/flows/get-monthly-group-data";
import type { MonthlyGroupData } from "@/ai/schemas";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Button } from "../ui/button";
import { generateMonthlySummary, type GenerateMonthlySummaryInput } from "@/ai/flows/generate-monthly-summary";

interface MonthlySummaryProps {
  month: Date;
}

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48"/>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40"/>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                   <Skeleton className="h-6 w-32"/>
                </CardHeader>
                <CardContent>
                     <Skeleton className="h-64 w-full" />
                </CardContent>
             </Card>
        </div>
    </div>
  );
}


export function MonthlySummary({ month }: MonthlySummaryProps) {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();

  const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);

  const groupId = currentUserData?.groupId;

  const [groupData, setGroupData] = useState<MonthlyGroupData | null>(null);
  const [aiSummary, setAiSummary] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (groupId) {
      setIsLoading(true);
      setAiSummary(null); // Reset AI summary when month changes
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

  const handleGenerateSummary = async () => {
      if (!groupData) return;
      setIsGenerating(true);
      
      const input: GenerateMonthlySummaryInput = {
          month: groupData.month,
          dailyData: groupData.members.map(m => ({ // This is a simplification, real data would be daily
              day: 0, // Placeholder
              meals: m.meals,
              foodExpense: m.expenses.food,
              electricityBill: m.expenses.electricity,
              gasBill: m.expenses.gas,
          }))
      };

      try {
          const summary = await generateMonthlySummary(input);
          setAiSummary(summary);
      } catch (e) {
          console.error(e);
          setError("Failed to generate AI summary.");
      } finally {
          setIsGenerating(false);
      }
  }

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
  const totalGroupMeals = members.reduce((acc, member) => acc + member.meals, 0);
  const memberCount = members.length;
  
  const monthQueryParam = format(month, 'yyyy-MM-dd');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
                <CardTitle>Overall Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <Link href={`/report/items?month=${monthQueryParam}`} className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1 whitespace-nowrap"><span className="font-bold text-lg">৳</span> Food</p>
                    <p className="text-2xl font-bold">৳{totalGroupFoodExpenses.toFixed(0)}</p>
                </Link>
                <Link href={`/report/contribution/electricity?month=${monthQueryParam}`} className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1 whitespace-nowrap"><Zap /> Electricity</p>
                    <p className="text-2xl font-bold">৳{totalGroupElectricity.toFixed(0)}</p>
                </Link>
                <Link href={`/report/contribution/gas?month=${monthQueryParam}`} className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1 whitespace-nowrap"><Flame /> Gas</p>
                    <p className="text-2xl font-bold">৳{totalGroupGas.toFixed(0)}</p>
                </Link>
                <Link href={`/report/meal-settlement?month=${monthQueryParam}`} className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1 whitespace-nowrap"><Utensils /> Meals</p>
                    <p className="text-2xl font-bold">{totalGroupMeals}</p>
                </Link>
                </div>
            </CardContent>
          </Card>
          
          <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2"><Scale/> Final Settlement</CardTitle>
                <CardDescription>A summary of who owes what for the month.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead className="text-right">Total Paid</TableHead>
                        <TableHead className="text-right">Final Balance</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {hasMembers ? members.map((member) => {
                        const mealRate = totalGroupFoodExpenses > 0 && totalGroupMeals > 0 ? totalGroupFoodExpenses / totalGroupMeals : 0;
                        const utilitySharePerMember = memberCount > 0 ? (totalGroupElectricity + totalGroupGas) / memberCount : 0;
                        const mealShare = member.meals * mealRate;
                        const mealBalance = member.expenses.food - mealShare;
                        const utilityPaid = member.expenses.electricity + member.expenses.gas;
                        const utilityBalance = utilityPaid - utilitySharePerMember;
                        const finalBalance = mealBalance + utilityBalance;
                        const totalPaid = member.expenses.food + utilityPaid;

                        return (
                        <TableRow key={member.id}>
                        <TableCell className="font-medium">
                            <Link href={`/report/${member.id}?month=${monthQueryParam}`} className="hover:underline text-primary">
                            {member.name}
                            </Link>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                            ৳{totalPaid.toFixed(2)}
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
                            <p className="text-muted-foreground">No members found for this month.</p>
                            </div>
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
            <Card className="sticky top-24">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bot /> AI Report</CardTitle>
                    <CardDescription>Get an AI-generated summary of this month's activity.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isGenerating ? (
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    ) : aiSummary ? (
                        <div className="text-sm text-muted-foreground space-y-4">
                            <p>{aiSummary.summary}</p>
                            <div>
                                <h4 className="font-semibold text-foreground mb-2">Comparison with Average</h4>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li><span className="font-medium">Meals:</span> Your group logged an average of { (totalGroupMeals / memberCount).toFixed(1) } meals/person. Average is {aiSummary.averageUser.mealCount}.</li>
                                    <li><span className="font-medium">Food Expense:</span> Your group spent ৳{ (totalGroupFoodExpenses / memberCount).toFixed(0) }/person. Average is ৳{aiSummary.averageUser.foodExpense}.</li>
                                    <li><span className="font-medium">Utilities:</span> Your group spent ৳{ ((totalGroupGas + totalGroupElectricity) / memberCount).toFixed(0) }/person. Average is ৳{aiSummary.averageUser.utilityExpense}.</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground p-4">
                            <p>Click the button to generate an AI summary and see how your group compares to others.</p>
                        </div>
                    )}
                </CardContent>
                <CardContent>
                    <Button onClick={handleGenerateSummary} disabled={isGenerating || !hasMembers} className="w-full">
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {aiSummary ? "Regenerate Summary" : "Generate Summary"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
