
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_MONTHLY_GROUP_DATA } from "@/lib/data";
import { notFound, useParams } from "next/navigation";
import { eachDayOfInterval, startOfMonth, endOfMonth, format } from "date-fns";
import { ArrowLeft, Utensils, Zap, Flame, DollarSign } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// This is mock data for a single member's daily activity
const MOCK_MEMBER_DAILY_DATA = [
    { date: "2025-09-01", meals: 2, expenses: { food: 350, electricity: 0, gas: 0 } },
    { date: "2025-09-02", meals: 3, expenses: { food: 200, electricity: 0, gas: 0 } },
    { date: "2025-09-03", meals: 1, expenses: { food: 0, electricity: 0, gas: 0 } },
    { date: "2025-09-04", meals: 2, expenses: { food: 500, electricity: 0, gas: 0 } },
    { date: "2025-09-05", meals: 2, expenses: { food: 150, electricity: 1200, gas: 500 } },
    // ... more days
];

export default function MemberReportPage() {
    const params = useParams();
    const memberId = params.memberId as string;

    const member = MOCK_MONTHLY_GROUP_DATA.members.find(m => m.id === memberId);

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
    const totalFoodExpenses = MOCK_MEMBER_DAILY_DATA.reduce((acc, day) => acc + day.expenses.food, 0);
    const totalElectricityExpenses = MOCK_MEMBER_DAILY_DATA.reduce((acc, day) => acc + day.expenses.electricity, 0);
    const totalGasExpenses = MOCK_MEMBER_DAILY_DATA.reduce((acc, day) => acc + day.expenses.gas, 0);

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

        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Daily Meal Log</CardTitle>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Meals Logged</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {daysInMonth.map((day) => {
                                const dayString = format(day, "yyyy-MM-dd");
                                const activity = MOCK_MEMBER_DAILY_DATA.find(d => d.date === dayString);
                                return (
                                    <TableRow key={dayString}>
                                        <TableCell className="font-medium">{format(day, "MMMM d, yyyy")}</TableCell>
                                        <TableCell className="text-right">{activity?.meals || 0}</TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Meal Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 text-center">
                         <div className="p-4 bg-muted/50 rounded-lg">
                            <Utensils className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Total Meals This Month</p>
                            <p className="text-2xl font-bold">{totalMeals}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Expense Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <DollarSign className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">Food Expenses</span>
                            </div>
                            <span className="text-lg font-bold">Tk{totalFoodExpenses.toLocaleString()}</span>
                        </div>
                         <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Zap className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">Electricity Bill</span>
                            </div>
                            <span className="text-lg font-bold">Tk{totalElectricityExpenses.toLocaleString()}</span>
                        </div>
                         <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                             <div className="flex items-center gap-3">
                                <Flame className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">Gas Bill</span>
                            </div>
                            <span className="text-lg font-bold">Tk{totalGasExpenses.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}

