import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Meal, Expense, Item } from "@/lib/types";
import { MealLog } from "./meal-log";
import { ExpenseLog } from "./expense-log";
import { ItemLog } from "./item-log";
import { Utensils, CreditCard, ShoppingCart } from "lucide-react";

interface DailyTrackerProps {
  meals: Meal[];
  expenses: Expense[];
  items: Item[];
  onSetItems: (items: Item[]) => void;
}

export function DailyTracker({ meals, expenses, items, onSetItems }: DailyTrackerProps) {
  return (
    <Tabs defaultValue="meals" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="meals"><Utensils className="mr-2 h-4 w-4" />Meals</TabsTrigger>
        <TabsTrigger value="items"><ShoppingCart className="mr-2 h-4 w-4" />Items</TabsTrigger>
        <TabsTrigger value="expenses"><CreditCard className="mr-2 h-4 w-4" />Expenses</TabsTrigger>
      </TabsList>
      <TabsContent value="meals">
        <MealLog meals={meals} />
      </TabsContent>
      <TabsContent value="items">
        <ItemLog items={items} onSetItems={onSetItems} />
      </TabsContent>
      <TabsContent value="expenses">
        <ExpenseLog expenses={expenses} />
      </TabsContent>
    </Tabs>
  );
}
