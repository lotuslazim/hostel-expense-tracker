
"use client";

import type { Meal, MealType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PlusCircle, Utensils, Sandwich, Soup, Cookie } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useFirebase, useUser, useDoc, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { doc, collection } from "firebase/firestore";

const mealTypes: MealType[] = ['lunch', 'dinner'];

const mealIcons: Record<MealType, React.ReactNode> = {
  breakfast: <Utensils className="h-6 w-6 text-muted-foreground" />,
  lunch: <Sandwich className="h-6 w-6 text-muted-foreground" />,
  dinner: <Soup className="h-6 w-6 text-muted-foreground" />,
  snack: <Cookie className="h-6 w-6 text-muted-foreground" />,
};

function LogMealDialog({ type, currentDate }: { type: MealType; currentDate: Date }) {
    const [open, setOpen] = useState(false);
    const [description, setDescription] = useState("");
    const [numberOfItems, setNumberOfItems] = useState(1);
    
    const { firestore } = useFirebase();
    const { user: currentUser } = useUser();
    const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserData } = useDoc(currentUserRef);
    const groupId = currentUserData?.groupId;

    const handleSaveMeal = () => {
        if (description.length === 0 || !groupId || !currentUser) return;
        
        const mealData = {
            userId: currentUser.uid,
            groupId,
            mealType: type,
            description: description,
            numberOfItems: numberOfItems,
            date: currentDate,
        };

        const mealsCol = collection(firestore, `groups/${groupId}/meals`);
        addDocumentNonBlocking(mealsCol, mealData);

        // Reset state
        setDescription("");
        setNumberOfItems(1);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) { // Reset on close
                setDescription("");
                setNumberOfItems(1);
            }
        }}>
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
                   <Label htmlFor={`item-count-${type}`}>Number of Meals</Label>
                   <Input 
                        id={`item-count-${type}`}
                        type="number"
                        min="1"
                        value={numberOfItems}
                        onChange={(e) => setNumberOfItems(parseInt(e.target.value, 10) || 1)}
                    />
                </div>
                 <div className="space-y-2">
                   <Label htmlFor={`description-${type}`}>Meal Description</Label>
                   <Input 
                        id={`description-${type}`}
                        placeholder="e.g., Rice, Dal, Chicken Curry"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <Button className="w-full" onClick={handleSaveMeal} disabled={description.length === 0}>Save Meal</Button>
              </div>
           </DialogContent>
         </Dialog>
    );
}


export function MealLog({ meals, currentDate }: { meals: Meal[], currentDate: Date }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Meal Log</CardTitle>
        <CardDescription>Log your meals to track your nutrition.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {mealTypes.map((type) => {
          const loggedMeal = meals.find((meal) => meal.mealType === type);
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
                 <LogMealDialog type={type} currentDate={currentDate} />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
