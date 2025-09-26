
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_MONTHLY_GROUP_DATA } from "@/lib/data";
import { ArrowLeft, Utensils } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const groupData = MOCK_MONTHLY_GROUP_DATA;
const totalGroupFoodExpenses = groupData.members.reduce((acc, member) => acc + member.expenses.food, 0);
const totalGroupMeals = groupData.members.reduce((acc, member) => acc + member.meals, 0);
const mealRate = totalGroupFoodExpenses > 0 && totalGroupMeals > 0 ? totalGroupFoodExpenses / totalGroupMeals : 0;

const settlementData = groupData.members.map(member => {
  const mealShare = member.meals * mealRate;
  const mealBalance = member.expenses.food - mealShare;
  return {
    ...member,
    mealShare,
    mealBalance,
  };
});

export default function MealSettlementPage() {
    const currentDate = new Date(MOCK_MONTHLY_GROUP_DATA.month);

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/report"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline">
                Monthly Meal Settlement
              </h1>
              <p className="text-muted-foreground">
                Breakdown of meal costs for {format(currentDate, "MMMM yyyy")}.
              </p>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Utensils className="h-5 w-5"/>
                        Meal Contribution per Member
                    </span>
                    <div className="text-right">
                        <p className="text-sm font-medium text-primary">Meal Rate</p>
                        <p className="text-xl font-bold text-primary">৳{mealRate.toFixed(2)}</p>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card>
    </div>
  );
}
