
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_MONTHLY_GROUP_DATA } from "@/lib/data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { Flame, Zap, DollarSign, Utensils, Hash } from "lucide-react";

const groupData = MOCK_MONTHLY_GROUP_DATA;
const totalGroupFoodExpenses = groupData.members.reduce((acc, member) => acc + member.expenses.food, 0);
const totalGroupElectricity = groupData.members.reduce((acc, member) => acc + member.expenses.electricity, 0);
const totalGroupGas = groupData.members.reduce((acc, member) => acc + member.expenses.gas, 0);
const totalGroupMeals = groupData.members.reduce((acc, member) => acc + member.meals, 0);
// Meal rate is based on food expenses only
const mealRate = totalGroupFoodExpenses > 0 && totalGroupMeals > 0 ? totalGroupFoodExpenses / totalGroupMeals : 0;

const settlementData = groupData.members.map(member => {
  const mealShare = member.meals * mealRate;
  // For simplicity, let's assume utility bills are split equally. In a real app, this logic could be more complex.
  const utilityShare = (totalGroupElectricity + totalGroupGas) / groupData.members.length;
  const totalShare = mealShare + utilityShare;
  const totalPaid = member.expenses.food + member.expenses.electricity + member.expenses.gas;
  const balance = totalPaid - totalShare;
  return {
    ...member,
    share: totalShare,
    paid: totalPaid,
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
      <CardContent className="space-y-8">
        <div>
          <h3 className="text-lg font-medium mb-4">Expense & Meal Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1"><DollarSign /> Total Food</p>
              <p className="text-2xl font-bold">৳{totalGroupFoodExpenses.toFixed(2)}</p>
            </div>
             <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1"><Zap /> Total Electricity</p>
              <p className="text-2xl font-bold">৳{totalGroupElectricity.toFixed(2)}</p>
            </div>
             <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1"><Flame /> Total Gas</p>
              <p className="text-2xl font-bold">৳{totalGroupGas.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1"><Utensils /> Total Meals</p>
              <p className="text-2xl font-bold">{totalGroupMeals}</p>
            </div>
             <div className="p-4 bg-primary/10 rounded-lg col-span-full">
              <p className="text-sm text-primary/80 flex items-center justify-center gap-2 mb-1"><Hash /> Calculated Food Rate per Meal</p>
              <p className="text-2xl font-bold text-primary">৳{mealRate.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div>
           <h3 className="text-lg font-medium mb-4">Member Settlement</h3>
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
                  <TableCell className="text-right">৳{member.share.toFixed(2)}</TableCell>
                  <TableCell className="text-right">৳{member.paid.toFixed(2)}</TableCell>
                  <TableCell className={cn(
                    "text-right font-bold",
                    member.balance >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {member.balance >= 0 ? `Gets ৳${member.balance.toFixed(2)}` : `Owes ৳${Math.abs(member.balance).toFixed(2)}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
