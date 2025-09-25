"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, Loader2 } from "lucide-react";
import { generateMonthlySummary, GenerateMonthlySummaryInput, MonthlySummaryOutput } from "@/ai/flows/generate-monthly-summary";
import { MOCK_MONTHLY_DATA } from "@/lib/data";

export function MonthlySummary() {
  const [summaryData, setSummaryData] = useState<MonthlySummaryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);
    setSummaryData(null);

    try {
      // In a real app, you would fetch and format the user's data for the month.
      const monthlyData: GenerateMonthlySummaryInput = MOCK_MONTHLY_DATA;
      const result = await generateMonthlySummary(monthlyData);
      setSummaryData(result);
    } catch (e) {
      console.error(e);
      setError("Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Generate Your Report</CardTitle>
        <CardDescription>
          Click the button to get an AI-powered summary of your meals and expenses for the month.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button onClick={handleGenerateSummary} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Generating..." : `Generate ${MOCK_MONTHLY_DATA.month} Summary`}
        </Button>

        {error && (
          <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        {summaryData && (
          <div className="space-y-6 pt-4 border-t">
            {/* Table View */}
            <div>
              <h3 className="text-lg font-semibold font-headline mb-2">Daily Breakdown</h3>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Meals Logged</TableHead>
                      <TableHead>Food Expense</TableHead>
                      <TableHead>Electricity Bill</TableHead>
                      <TableHead>Gas Bill</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_MONTHLY_DATA.dailyData.map((d) => (
                      <TableRow key={d.day}>
                        <TableCell className="font-medium">{d.day}</TableCell>
                        <TableCell>{d.meals}</TableCell>
                        <TableCell>Tk{d.foodExpense.toFixed(2)}</TableCell>
                        <TableCell>Tk{d.electricityBill.toFixed(2)}</TableCell>
                        <TableCell>Tk{d.gasBill.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {/* AI Summary */}
            <div>
              <h3 className="text-lg font-semibold font-headline">AI Insights</h3>
              <div className="text-sm text-foreground/80 whitespace-pre-wrap bg-muted/50 p-4 rounded-md">
                {summaryData.summary}
              </div>
            </div>

            {/* User Comparison */}
            <div>
              <h3 className="text-lg font-semibold font-headline">How You Compare</h3>
              <Card>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Your Monthly Meals</p>
                    <p className="text-2xl font-bold">{MOCK_MONTHLY_DATA.dailyData.reduce((acc, d) => acc + d.meals, 0)}</p>
                  </div>
                   <div className="text-center">
                    <p className="text-sm text-muted-foreground">Average User Meals</p>
                    <p className="text-2xl font-bold">{summaryData.averageUser.mealCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Your Food Spend</p>
                    <p className="text-2xl font-bold">Tk{MOCK_MONTHLY_DATA.dailyData.reduce((acc, d) => acc + d.foodExpense, 0).toFixed(2)}</p>
                  </div>
                   <div className="text-center">
                    <p className="text-sm text-muted-foreground">Average Food Spend</p>
                    <p className="text-2xl font-bold">Tk{summaryData.averageUser.foodExpense.toFixed(2)}</p>
                  </div>
                   <div className="text-center">
                    <p className="text-sm text-muted-foreground">Your Utility Spend</p>
                    <p className="text-2xl font-bold">Tk{MOCK_MONTHLY_DATA.dailyData.reduce((acc, d) => acc + d.electricityBill + d.gasBill, 0).toFixed(2)}</p>
                  </div>
                   <div className="text-center">
                    <p className="text-sm text-muted-foreground">Average Utility Spend</p>
                    <p className="text-2xl font-bold">Tk{summaryData.averageUser.utilityExpense.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
