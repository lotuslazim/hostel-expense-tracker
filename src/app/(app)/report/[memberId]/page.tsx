
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_MONTHLY_GROUP_DATA } from "@/lib/data";
import { notFound } from "next/navigation";
import { eachDayOfInterval, startOfMonth, endOfMonth, format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// This is mock data for a single member's daily activity
const MOCK_MEMBER_DAILY_DATA = [
    { date: "2025-09-01", meals: 2, expenses: 350 },
    { date: "2025-09-02", meals: 3, expenses: 200 },
    { date: "2025-09-03", meals: 1, expenses: 0 },
    { date: "2025-09-04", meals: 2, expenses: 500 },
    { date: "2025-09-05", meals: 2, expenses: 150 },
    // ... more days
];

export default function MemberReportPage({ params }: { params: { memberId: string } }) {
    const member = MOCK_MONTHLY_GROUP_DATA.members.find(m => m.id === params.memberId);

    if (!member) {
        notFound();
    }
    
    // In a real app, you would fetch the month from a query param or state
    const currentDate = new Date(MOCK_MONTHLY_GROUP_DATA.month);
    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    });

    const totalMeals = MOCK_MEMBER_DAILY_DATA.reduce((acc, day) => acc + day.meals, 0);
    const totalExpenses = MOCK_MEMBER_DAILY_DATA.reduce((acc, day) => acc + day.expenses, 0);


  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/report"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline">
                {member.name}'s Daily Log
              </h1>
              <p className="text-muted-foreground">
                A daily breakdown of meals and expenses for {format(currentDate, "MMMM yyyy")}.
              </p>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Daily Activity</CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-center">Meals Logged</TableHead>
                            <TableHead className="text-right">Expenses Logged</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {daysInMonth.map((day) => {
                            const dayString = format(day, "yyyy-MM-dd");
                            const activity = MOCK_MEMBER_DAILY_DATA.find(d => d.date === dayString);
                            return (
                                <TableRow key={dayString}>
                                    <TableCell className="font-medium">{format(day, "MMMM d, yyyy")}</TableCell>
                                    <TableCell className="text-center">{activity?.meals || 0}</TableCell>
                                    <TableCell className="text-right">Tk{(activity?.expenses || 0).toFixed(2)}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Monthly Totals</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-center">
                 <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Meals</p>
                    <p className="text-2xl font-bold">{totalMeals}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold">Tk{totalExpenses.toLocaleString()}</p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

