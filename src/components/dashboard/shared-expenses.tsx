
"use client";

import type { Expense } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PiggyBank } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import placeholderImages from "@/lib/placeholder-images.json";

interface SharedExpensesProps {
  expenses: Expense[];
  members: {id: string, displayName: string, email: string}[];
}

export function SharedExpenses({ expenses, members }: SharedExpensesProps) {
  
  const getMemberName = (userId: string) => {
    const member = members.find(m => m.id === userId);
    return member?.displayName || member?.email?.split('@')[0] || 'Unknown';
  };
  
  const getMemberAvatar = (userId: string) => {
    // For simplicity, cycle through available avatars.
    // A more robust solution might map user IDs to specific avatars.
    const userIndex = members.findIndex(m => m.id === userId);
    const avatarId = userIndex !== -1 ? `user-avatar-${(userIndex % 2) + 2}` : "user-avatar";
    return placeholderImages.placeholderImages.find(p => p.id === avatarId)?.imageUrl;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shared Expense Feed</CardTitle>
        <CardDescription>A real-time view of all expenses logged by group members.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Expense</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length > 0 ? (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                         <Avatar className="h-9 w-9">
                           <AvatarImage src={getMemberAvatar(expense.userId)} />
                           <AvatarFallback>{getMemberName(expense.userId).charAt(0)}</AvatarFallback>
                         </Avatar>
                        <div>
                          <p className="font-medium">{getMemberName(expense.userId)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format( (expense.date as any).toDate(), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{expense.description}</p>
                      <Badge variant="secondary">{expense.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ৳{expense.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <PiggyBank className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">No expenses logged yet.</p>
                      <p className="text-xs text-muted-foreground">Be the first to record an expense!</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
