import type { Meal, MealType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PlusCircle, Utensils, Sandwich, Soup, Cookie } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const mealTypes: MealType[] = ['lunch', 'dinner'];

const mealIcons: Record<MealType, React.ReactNode> = {
  breakfast: <Utensils className="h-6 w-6 text-muted-foreground" />,
  lunch: <Sandwich className="h-6 w-6 text-muted-foreground" />,
  dinner: <Soup className="h-6 w-6 text-muted-foreground" />,
  snack: <Cookie className="h-6 w-6 text-muted-foreground" />,
};

export function MealLog({ meals }: { meals: Meal[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Meal Log</CardTitle>
        <CardDescription>Log your meals to track your nutrition.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {mealTypes.map((type) => {
          const loggedMeal = meals.find((meal) => meal.type === type);
          return (
            <div key={type} className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-4">
                {mealIcons[type]}
                <div>
                  <h3 className="font-semibold capitalize">{type}</h3>
                  {loggedMeal ? (
                    <p className="text-sm text-muted-foreground">{loggedMeal.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not logged yet</p>
                  )}
                </div>
              </div>
              {loggedMeal ? (
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Logged</span>
                </div>
              ) : (
                 <Dialog>
                   <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" /> Log Meal
                      </Button>
                   </DialogTrigger>
                   <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Log {type}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                           <Label htmlFor={`description-${type}`}>Description</Label>
                           <Input id={`description-${type}`} placeholder="e.g., Avocado toast" />
                        </div>
                        <Button className="w-full">Save Meal</Button>
                      </div>
                   </DialogContent>
                 </Dialog>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
