import { WeeklySummary } from "@/components/report/weekly-summary";

export default function ReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Weekly Summary</h1>
        <p className="text-muted-foreground">
          An AI-generated report of your weekly activity.
        </p>
      </div>
      <WeeklySummary />
    </div>
  );
}
