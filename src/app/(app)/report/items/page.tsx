
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_MONTHLY_GROUP_DATA } from "@/lib/data";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const memberFoodExpenses = MOCK_MONTHLY_GROUP_DATA.members.map(member => ({
    id: member.id,
    name: member.name,
    foodExpense: member.expenses.food,
}));


export default function MonthlyItemsPage() {

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/report"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline">
                Monthly Item Summary
              </h1>
              <p className="text-muted-foreground">
                Total quantities of all items purchased this month.
              </p>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5"/>
                    Food Expense by Member
                </CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead className="text-right">Food Expense</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {memberFoodExpenses.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium">{member.name}</TableCell>
                                <TableCell className="text-right">৳{member.foodExpense.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
