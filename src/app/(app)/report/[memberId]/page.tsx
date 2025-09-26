
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_MONTHLY_GROUP_DATA } from "@/lib/data";
import { notFound, useParams } from "next/navigation";
import { eachDayOfInterval, startOfMonth, endOfMonth, format } from "date-fns";
import { ArrowLeft, Utensils, Zap, Flame, Scale, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

    const groupData = MOCK_MONTHLY_GROUP_DATA;
    const member = groupData.members.find(m => m.id === memberId);

    if (!member) {
        notFound();
    }

    // Calculations from monthly-summary
    const totalGroupFoodExpenses = groupData.members.reduce((acc, member) => acc + member.expenses.food, 0);
    const totalGroupElectricity = groupData.members.reduce((acc, member) => acc + member.expenses.electricity, 0);
    const totalGroupGas = groupData.members.reduce((acc, member) => acc + member.expenses.gas, 0);
    const totalGroupUtilities = totalGroupElectricity + totalGroupGas;
    const totalGroupMeals = groupData.members.reduce((acc, member) => acc + member.meals, 0);
    const memberCount = groupData.members.length;

    const mealRate = totalGroupFoodExpenses > 0 && totalGroupMeals > 0 ? totalGroupFoodExpenses / totalGroupMeals : 0;
    const utilitySharePerMember = memberCount > 0 ? totalGroupUtilities / memberCount : 0;

    const mealShare = member.meals * mealRate;
    const mealBalance = member.expenses.food - mealShare;
    const utilityPaid = member.expenses.electricity + member.expenses.gas;
    const utilityBalance = utilityPaid - utilitySharePerMember;
    const finalBalance = mealBalance + utilityBalance;

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
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5" /> Settlement Calculation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium text-muted-foreground">Meal Balance</span>
                    <div className="text-right">
                        <p className={cn("font-semibold", mealBalance >= 0 ? 'text-green-600' : 'text-red-600')}>
                            {mealBalance >= 0 ? `+৳${mealBalance.toFixed(2)}` : `-৳${Math.abs(mealBalance).toFixed(2)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">(Paid ৳{member.expenses.food.toFixed(2)} - Share ৳{mealShare.toFixed(2)})</p>
                    </div>
                </div>
                 <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium text-muted-foreground">Utility Balance</span>
                     <div className="text-right">
                        <p className={cn("font-semibold", utilityBalance >= 0 ? 'text-green-600' : 'text-red-600')}>
                            {utilityBalance >= 0 ? `+৳${utilityBalance.toFixed(2)}` : `-৳${Math.abs(utilityBalance).toFixed(2)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">(Paid ৳{utilityPaid.toFixed(2)} - Share ৳{utilitySharePerMember.toFixed(2)})</p>
                    </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-background border rounded-lg">
                    <span className="font-bold text-lg">Final Balance</span>
                     <div className="text-right">
                        <p className={cn("font-bold text-xl", finalBalance >= 0 ? 'text-green-600' : 'text-red-600')}>
                           {finalBalance >= 0 ? `Gets Back: ৳${finalBalance.toFixed(2)}` : `Owes: ৳${Math.abs(finalBalance).toFixed(2)}`}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>

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
                                <span className="font-bold text-lg text-muted-foreground">৳</span>
                                <span className="font-medium">Food Expenses</span>
                            </div>
                            <span className="text-lg font-bold">৳{totalFoodExpenses.toLocaleString()}</span>
                        </div>
                         <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Zap className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">Electricity Bill</span>
                            </div>
                            <span className="text-lg font-bold">৳{totalElectricityExpenses.toLocaleString()}</span>
                        </div>
                         <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                             <div className="flex items-center gap-3">
                                <Flame className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">Gas Bill</span>
                            </div>
                            <span className="text-lg font-bold">৳{totalGasExpenses.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}


    