
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_MONTHLY_GROUP_DATA } from "@/lib/data";
import { ArrowLeft, Zap, Flame } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useParams, notFound } from "next/navigation";
import { format } from "date-fns";

const categoryDetails: Record<string, { icon: React.ReactNode, key: 'electricity' | 'gas' }> = {
    electricity: { icon: <Zap className="h-5 w-5"/>, key: 'electricity' },
    gas: { icon: <Flame className="h-5 w-5"/>, key: 'gas' },
};

export default function ContributionPage() {
    const params = useParams();
    const category = params.category as string;

    const details = categoryDetails[category];

    if (!details) {
        notFound();
    }
    
    const currentDate = new Date(MOCK_MONTHLY_GROUP_DATA.month);
    const contributions = MOCK_MONTHLY_GROUP_DATA.members.map(member => ({
        id: member.id,
        name: member.name,
        amount: member.expenses[details.key]
    }));

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/report"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline capitalize">
                Monthly {category} Contributions
              </h1>
              <p className="text-muted-foreground">
                Breakdown of {category} payments for {format(currentDate, "MMMM yyyy")}.
              </p>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 capitalize">
                    {details.icon}
                    {category} Contribution per Member
                </CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead className="text-right">Amount Paid</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contributions.length > 0 ? contributions.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-right">৳{item.amount.toFixed(2)}</TableCell>
                            </TableRow>
                        )) : (
                             <TableRow>
                                <TableCell colSpan={2} className="text-center h-24">
                                    No contributions logged for this category.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}

