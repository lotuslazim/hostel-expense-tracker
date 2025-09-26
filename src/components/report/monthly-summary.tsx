
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_MONTHLY_GROUP_DATA } from "@/lib/data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { Flame, Zap, Utensils, Users, Scale } from "lucide-react";

const groupData = MOCK_MONTHLY_GROUP_DATA;
const totalGroupFoodExpenses = groupData.members.reduce((acc, member) => acc + member.expenses.food, 0);
const totalGroupElectricity = groupData.members.reduce((acc, member) => acc + member.expenses.electricity, 0);
const totalGroupGas = groupData.members.reduce((acc, member) => acc + member.expenses.gas, 0);
const totalGroupUtilities = totalGroupElectricity + totalGroupGas;
const totalGroupMeals = groupData.members.reduce((acc, member) => acc + member.meals, 0);
const memberCount = groupData.members.length;

// Meal rate is based on food expenses only
const mealRate = totalGroupFoodExpenses > 0 && totalGroupMeals > 0 ? totalGroupFoodExpenses / totalGroupMeals : 0;
// For simplicity, let's assume utility bills are split equally.
const utilitySharePerMember = memberCount > 0 ? totalGroupUtilities / memberCount : 0;


const settlementData = groupData.members.map(member => {
  const mealShare = member.meals * mealRate;
  const mealBalance = member.expenses.food - mealShare;

  const utilityPaid = member.expenses.electricity + member.expenses.gas;
  const utilityBalance = utilityPaid - utilitySharePerMember;
  
  const finalBalance = mealBalance + utilityBalance;

  return {
    ...member,
    mealShare,
    mealBalance,
    utilityPaid,
    utilityBalance,
    finalBalance,
  };
});

interface MonthlySummaryProps {
  month: Date;
}

export function MonthlySummary({ month }: MonthlySummaryProps) {
  // In a real app, you would fetch data for the given `month`
  // For now, we use mock data and just display the selected month.
  
  return (
    <div className="space-y-8">
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>Monthly Settlement for {format(month, "MMMM yyyy")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Overall Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <Link href="/report/items" className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1"><span className="font-bold text-lg">৳</span> Total Food</p>
                <p className="text-2xl font-bold">৳{totalGroupFoodExpenses.toFixed(2)}</p>
              </Link>
              <Link href="/report/contribution/electricity" className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1"><Zap /> Total Electricity</p>
                <p className="text-2xl font-bold">৳{totalGroupElectricity.toFixed(2)}</p>
              </Link>
              <Link href="/report/contribution/gas" className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1"><Flame /> Total Gas</p>
                <p className="text-2xl font-bold">৳{totalGroupGas.toFixed(2)}</p>
              </Link>
              <Link href="/report/meal-settlement" className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1"><Utensils /> Total Meals</p>
                <p className="text-2xl font-bold">{totalGroupMeals}</p>
              </Link>
              <div className="p-4 bg-primary/20 rounded-lg col-span-full md:col-span-2">
                <p className="text-sm text-primary/80 flex items-center justify-center gap-2 mb-1"><Utensils /> Meal Rate</p>
                <p className="text-2xl font-bold text-primary">৳{mealRate.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-secondary/80 rounded-lg col-span-full md:col-span-2">
                <p className="text-sm text-secondary-foreground/80 flex items-center justify-center gap-2 mb-1"><Users /> Utility Share per Member</p>
                <p className="text-2xl font-bold text-secondary-foreground">৳{utilitySharePerMember.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium my-4 flex items-center gap-2"><Scale/> Final Settlement</h3>
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead className="text-right">Final Balance</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlementData.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <Link href={`/report/${member.id}`} className="hover:underline text-primary">
                          {member.name}
                        </Link>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-bold",
                        member.finalBalance >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {member.finalBalance >= 0 ? `+৳${member.finalBalance.toFixed(2)}` : `-৳${Math.abs(member.finalBalance).toFixed(2)}`}
                      </TableCell>
                      <TableCell className={cn(
                          "text-right font-semibold",
                          member.finalBalance >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {member.finalBalance >= 0 ? 'Gets Back' : 'Owes'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
