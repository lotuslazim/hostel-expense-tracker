"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { generateWeeklySummary, GenerateWeeklySummaryInput } from "@/ai/flows/generate-weekly-summary";
import { MOCK_WEEKLY_DATA } from "@/lib/data";

export function WeeklySummary() {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);
    setSummary(null);

    try {
      // In a real application, you would fetch the user's data for the past week
      // from your database and format it into strings.
      // For this example, we'll use mock data.
      const weeklyData: GenerateWeeklySummaryInput = MOCK_WEEKLY_DATA;
      
      const result = await generateWeeklySummary(weeklyData);
      setSummary(result.summary);

    } catch (e) {
      console.error(e);
      setError("Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Generate Your Report</CardTitle>
        <CardDescription>
          Click the button to get an AI-powered summary of your meals, expenses, and purchases from the last week.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button onClick={handleGenerateSummary} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Generating..." : "Generate Weekly Summary"}
        </Button>

        {error && (
          <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        {summary && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold font-headline">Your Weekly Insights</h3>
            <div className="text-sm text-foreground/80 whitespace-pre-wrap bg-muted/50 p-4 rounded-md">
              {summary}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
