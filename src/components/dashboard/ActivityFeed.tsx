
"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Expense } from "@/lib/types";

interface ActivityFeedProps {
  expenses: Expense[];
}

export function ActivityFeed({ expenses }: ActivityFeedProps) {

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => (b.date as any).toDate() - (a.date as any).toDate());
  }, [expenses]);


  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Monthly Expense Feed</CardTitle>
                <CardDescription>Recent group expenses.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(85vh-100px)]">
          <div className="space-y-4 pr-4">
            {sortedExpenses.length > 0 ? sortedExpenses.map((item) => (
              <div key={`expense-${item.id}`} className="flex items-start gap-4">
                <div className="mt-1 p-2 rounded-full bg-green-100 dark:bg-green-900/50">
                    <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{item.userName}</span>
                    {` added an expense of ৳${item.amount} for "${item.description || item.category}"`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format((item.date as any).toDate(), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    {item.category}
                  </Badge>
                </div>
              </div>
            )) : (
                <div className="text-center py-16 text-muted-foreground">
                    <p>No expenses logged this month.</p>
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
