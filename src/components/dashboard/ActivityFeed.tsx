
"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Utensils, ShoppingCart, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MealLog, Expense } from "@/lib/types";

interface ActivityFeedProps {
  meals: MealLog[];
  expenses: Expense[];
}

type CombinedActivity = (MealLog & { type: 'meal' }) | (Expense & { type: 'expense' });

export function ActivityFeed({ meals, expenses }: ActivityFeedProps) {
  const [filterType, setFilterType] = useState<"all" | "meal" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  const combinedFeed: CombinedActivity[] = useMemo(() => {
    const mealLogs = meals.map(m => ({ ...m, type: 'meal' as const }));
    const expenseLogs = expenses.map(e => ({ ...e, type: 'expense' as const }));
    return [...mealLogs, ...expenseLogs].sort((a, b) => (b.date as any).toDate() - (a.date as any).toDate());
  }, [meals, expenses]);

  const filteredFeed = useMemo(() => {
    return combinedFeed.filter(item => {
      const typeMatch = filterType === 'all' || item.type === filterType;
      const dateMatch = !filterDate || format((item.date as any).toDate(), 'yyyy-MM-dd') === format(filterDate, 'yyyy-MM-dd');
      
      let categoryMatch = true;
      if (filterCategory !== 'all') {
        if (item.type === 'meal') {
          categoryMatch = item.mealType === filterCategory;
        } else if (item.type === 'expense') {
          categoryMatch = item.category === filterCategory;
        } else {
            categoryMatch = false;
        }
      }
      return typeMatch && dateMatch && categoryMatch;
    });
  }, [combinedFeed, filterType, filterCategory, filterDate]);

  const handleClearFilters = () => {
    setFilterType('all');
    setFilterCategory('all');
    setFilterDate(undefined);
  }
  
  const hasActiveFilters = filterType !== 'all' || filterCategory !== 'all' || filterDate !== undefined;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Activity Feed</CardTitle>
                <CardDescription>Recent group activities.</CardDescription>
            </div>
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="relative">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                        {hasActiveFilters && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span></span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4 space-y-4">
                    <h4 className="font-medium leading-none">Filters</h4>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Type</p>
                        <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="meal">Meals</SelectItem>
                                <SelectItem value="expense">Expenses</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Category</p>
                        <Select value={filterCategory} onValueChange={setFilterCategory} disabled={filterType === 'all'}>
                            <SelectTrigger><SelectValue placeholder="Select category"/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {filterType === 'meal' && <>
                                    <SelectItem value="lunch">Lunch</SelectItem>
                                    <SelectItem value="dinner">Dinner</SelectItem>
                                </>}
                                {filterType === 'expense' && <>
                                    <SelectItem value="Food & Groceries">Food & Groceries</SelectItem>
                                    <SelectItem value="Electricity">Electricity</SelectItem>
                                    <SelectItem value="Gas">Gas</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </>}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Date</p>
                        <Calendar
                            mode="single"
                            selected={filterDate}
                            onSelect={setFilterDate}
                            className="rounded-md border"
                        />
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleClearFilters} disabled={!hasActiveFilters}>
                        <X className="mr-2 h-4 w-4" /> Clear Filters
                    </Button>
                </PopoverContent>
            </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(85vh-100px)]">
          <div className="space-y-4 pr-4">
            {filteredFeed.length > 0 ? filteredFeed.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex items-start gap-4">
                <div className={`mt-1 p-2 rounded-full ${item.type === 'meal' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-green-100 dark:bg-green-900/50'}`}>
                  {item.type === 'meal' ? (
                    <Utensils className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  ) : (
                    <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{item.userName}</span>
                    {item.type === 'meal' ? ` logged ${item.mealNumber} ${item.mealType}(s).` : ` added an expense of ৳${item.amount}.`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format((item.date as any).toDate(), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    {item.type === 'meal' ? item.mealType : item.category}
                  </Badge>
                </div>
              </div>
            )) : (
                <div className="text-center py-16 text-muted-foreground">
                    <p>No activities found for the selected filters.</p>
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
