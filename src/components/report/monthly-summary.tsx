
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_MONTHLY_GROUP_DATA } from "@/lib/data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { Flame, Zap, Utensils, Hash, Users, Scale } from "lucide-react";

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
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>Monthly Settlement for {format(month, "MMMM yyyy")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h3 className="text-lg font-medium mb-4">Overall Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-1"><span className="font-bold text-lg">৳</span> Total Food</p>
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
            <div className="p-4 bg-secondary/80 rounded-lg col-span-full md:col-span-4">
              <p className="text-sm text-secondary-foreground/80 flex items-center justify-center gap-2 mb-1"><Users /> Utility Share per Member</p>
              <p className="text-2xl font-bold text-secondary-foreground">৳{utilitySharePerMember.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div>
           <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Utensils /> Meal Settlement (Meal Rate: ৳{mealRate.toFixed(2)})</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-center">Meals</TableHead>
                <TableHead className="text-right">Food Paid</TableHead>
                <TableHead className="text-right">Meal Share</TableHead>
                <TableHead className="text-right">Balance</TableHead>
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
                  <TableCell className="text-center">{member.meals}</TableCell>
                  <TableCell className="text-right">৳{member.expenses.food.toFixed(2)}</TableCell>
                  <TableCell className="text-right">৳{member.mealShare.toFixed(2)}</TableCell>
                  <TableCell className={cn(
                    "text-right font-medium",
                    member.mealBalance >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {member.mealBalance >= 0 ? `+৳${member.mealBalance.toFixed(2)}` : `-৳${Math.abs(member.mealBalance).toFixed(2)}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
           <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Zap /> Utility Settlement</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Electricity Paid</TableHead>
                <TableHead className="text-right">Gas Paid</TableHead>
                <TableHead className="text-right font-bold">Total Paid</TableHead>
                <TableHead className="text-right">Utility Share</TableHead>
                <TableHead className="text-right">Balance</TableHead>
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
                  <TableCell className="text-right">৳{member.expenses.electricity.toFixed(2)}</TableCell>
                  <TableCell className="text-right">৳{member.expenses.gas.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">৳{member.utilityPaid.toFixed(2)}</TableCell>
                  <TableCell className="text-right">৳{utilitySharePerMember.toFixed(2)}</TableCell>
                   <TableCell className={cn(
                    "text-right font-medium",
                    member.utilityBalance >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {member.utilityBalance >= 0 ? `+৳${member.utilityBalance.toFixed(2)}` : `-৳${Math.abs(member.utilityBalance).toFixed(2)}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
           <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Scale /> Final Settlement</h3>
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
                    <TableRow key={member.id} className="bg-muted/30">
                      <TableCell className="font-medium">
                        <Link href={`/report/${member.id}`} className="hover:underline text-primary">
                          {member.name}
                        </Link>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-bold text-lg",
                        member.finalBalance >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        ৳{Math.abs(member.finalBalance).toFixed(2)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-bold text-lg",
                        member.finalBalance >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {member.finalBalance >= 0 ? `Gets Back` : `Owes`}
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

