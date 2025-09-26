"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, Loader2 } from "lucide-react";
import { generateMonthlySummary, GenerateMonthlySummaryInput, MonthlySummaryOutput } from "@/ai/flows/generate-monthly-summary";
import { MOCK_MONTHLY_GROUP_DATA } from "@/lib/data";
import { cn } from "@/lib/utils";

const groupData = MOCK_MONTHLY_GROUP_DATA;
const totalGroupMeals = groupData.members.reduce((acc, member) => acc + member.meals, 0);
const totalGroupExpenses = groupData.members.reduce((acc, member) => acc + member.expenses, 0);
const mealRate = totalGroupExpenses / totalGroupMeals;

const settlementData = groupData.members.map(member => {
  const share = member.meals * mealRate;
  const balance = member.expenses - share;
  return {
    ...member,
    share,
    balance
  };
});

export function MonthlySummary() {
  const [summaryData, setSummaryData] = useState<MonthlySummaryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);
    setSummaryData(null);

    try {
      // In a real app, this data would be fetched and formatted for the entire group.
      const monthlyData: GenerateMonthlySummaryInput = {
        month: groupData.month,
        dailyData: [] // This part of the input is now less relevant for the group summary, but the AI flow could be adapted.
      };
      // We are not calling the AI for now, as it's not set up for group data.
      // const result = await generateMonthlySummary(monthlyData);
      // setSummaryData(result);
      
      // For demonstration, we'll just show the settlement table without AI insights for now.
      // This timeout simulates a network request.
      setTimeout(() => {
        setSummaryData({} as MonthlySummaryOutput); // Mock empty summary to trigger display
      }, 1000);

    } catch (e) {
      console.error(e);
      setError("Failed to generate summary. Please try again.");
    } finally {
      // We will set loading to false inside the timeout for demo purposes
      // setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Generate Your Report</CardTitle>
        <CardDescription>
          Click the button to get an AI-powered summary and cost settlement for the month.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button onClick={handleGenerateSummary} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Generating..." : `Generate ${groupData.month} Summary`}
        </Button>

        {error && (
          <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        {(summaryData || isLoading) && (
          <div className="space-y-8 pt-4 border-t">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center pt-8">
                 <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                 <p className="mt-4 text-muted-foreground">Calculating settlement...</p>
               </div>
            ) : (
             <>
                {/* Settlement Summary */}
                <div>
                  <h3 className="text-xl font-semibold font-headline mb-4">Monthly Settlement</h3>
                  <Card>
                    <CardHeader>
                       <CardTitle>Summary for {groupData.month}</CardTitle>
                       <CardDescription>
                         The meal rate is calculated based on total group expenses divided by total meals.
                       </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="grid grid-cols-3 gap-4 text-center mb-6">
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Total Expenses</p>
                            <p className="text-2xl font-bold">Tk{totalGroupExpenses.toFixed(2)}</p>
                          </div>
                           <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Total Meals</p>
                            <p className="text-2xl font-bold">{totalGroupMeals}</p>
                          </div>
                          <div className="p-4 bg-primary/10 rounded-lg">
                            <p className="text-sm text-primary/80">Calculated Meal Rate</p>
                            <p className="text-2xl font-bold text-primary">Tk{mealRate.toFixed(2)}</p>
                          </div>
                       </div>
                       <Table>
                         <TableHeader>
                           <TableRow>
                             <TableHead>Member</TableHead>
                             <TableHead className="text-center">Meals Eaten</TableHead>
                             <TableHead className="text-right">Their Share</TableHead>
                             <TableHead className="text-right">Actual Paid</TableHead>
                             <TableHead className="text-right">Balance</TableHead>
                           </TableRow>
                         </TableHeader>
                         <TableBody>
                           {settlementData.map((member) => (
                             <TableRow key={member.name}>
                               <TableCell className="font-medium">{member.name}</TableCell>
                               <TableCell className="text-center">{member.meals}</TableCell>
                               <TableCell className="text-right">Tk{member.share.toFixed(2)}</TableCell>
                               <TableCell className="text-right">Tk{member.expenses.toFixed(2)}</TableCell>
                               <TableCell className={cn(
                                 "text-right font-bold",
                                 member.balance >= 0 ? "text-green-600" : "text-red-600"
                               )}>
                                 {member.balance >= 0 ? `Gets Tk${member.balance.toFixed(2)}` : `Owes Tk${Math.abs(member.balance).toFixed(2)}`}
                               </TableCell>
                             </TableRow>
                           ))}
                         </TableBody>
                       </Table>
                    </CardContent>
                  </Card>
                </div>
                
                {/* AI Summary would go here if enabled */}

             </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
