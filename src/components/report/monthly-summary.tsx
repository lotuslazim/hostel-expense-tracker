
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_MONTHLY_GROUP_DATA } from "@/lib/data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";

const groupData = MOCK_MONTHLY_GROUP_DATA;
const totalGroupMeals = groupData.members.reduce((acc, member) => acc + member.meals, 0);
const totalGroupExpenses = groupData.members.reduce((acc, member) => acc + member.expenses, 0);
const mealRate = totalGroupExpenses > 0 && totalGroupMeals > 0 ? totalGroupExpenses / totalGroupMeals : 0;

const settlementData = groupData.members.map(member => {
  const share = member.meals * mealRate;
  const balance = member.expenses - share;
  return {
    ...member,
    share,
    balance
  };
});

interface MonthlySummaryProps {
  month: Date;
}

export function MonthlySummary({ month }: MonthlySummaryProps) {
  // In a real app, you would fetch data for the given `month`
  // For now, we use mock data and just display the selected month.
  
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Monthly Settlement for {format(month, "MMMM yyyy")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4 text-center">
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
                <TableCell className="font-medium">
                   <Link href={`/report/${member.id}`} className="hover:underline text-primary">
                    {member.name}
                  </Link>
                </TableCell>
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
  );
}
