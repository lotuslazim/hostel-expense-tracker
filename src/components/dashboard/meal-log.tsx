
"use client";

import type { Meal, MealType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PlusCircle, Utensils, Sandwich, Soup, Cookie, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useFirebase, useUser, useDoc, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";

const mealTypes: MealType[] = ['lunch', 'dinner'];

const mealIcons: Record<MealType, React.ReactNode> = {
  breakfast: <Utensils className="h-6 w-6 text-muted-foreground" />,
  lunch: <Sandwich className="h-6 w-6 text-muted-foreground" />,
  dinner: <Soup className="h-6 w-6 text-muted-foreground" />,
  snack: <Cookie className="h-6 w-6 text-muted-foreground" />,
};

function LogMealDialog({ type, currentDate }: { type: MealType; currentDate: Date }) {
    const [open, setOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState("");
    const [items, setItems] = useState<string[]>([]);
    
    const { firestore } = useFirebase();
    const { user: currentUser } = useUser();
    const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserData } = useDoc(currentUserRef);
    const groupId = currentUserData?.groupId;

    const handleAddItem = () => {
        if (!currentItem) return;
        setItems([...items, currentItem]);
        setCurrentItem("");
    }

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    }

    const handleSaveMeal = () => {
        if (items.length === 0 || !groupId || !currentUser) return;
        
        const mealData = {
            userId: currentUser.uid,
            groupId,
            mealType: type,
            description: items.join(', '),
            numberOfItems: items.length,
            date: currentDate,
        };

        const mealsCol = collection(firestore, `groups/${groupId}/meals`);
        addDocumentNonBlocking(mealsCol, mealData);

        // Reset state
        setCurrentItem("");
        setItems([]);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) { // Reset on close
                setCurrentItem("");
                setItems([]);
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
                   <Label htmlFor={`description-${type}`}>Item Name</Label>
                   <div className="flex gap-2">
                     <Input 
                          id={`description-${type}`}
                          placeholder="e.g., Grilled Chicken"
                          value={currentItem}
                          onChange={(e) => setCurrentItem(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem();}}}
                      />
                      <Button onClick={handleAddItem} disabled={!currentItem}>Add</Button>
                   </div>
                </div>

                <div className="space-y-2">
                    <Label>Logged Items</Label>
                    <div className="space-y-2 rounded-md border p-2 min-h-[80px]">
                        {items.length > 0 ? (
                            items.map((item, index) => (
                                <Badge key={index} variant="secondary" className="mr-2 flex justify-between items-center max-w-max">
                                    {item}
                                    <button onClick={() => handleRemoveItem(index)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                                        <X className="h-3 w-3" />
                                        <span className="sr-only">Remove {item}</span>
                                    </button>
                                </Badge>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground px-2 py-1">No items added yet.</p>
                        )}
                    </div>
                </div>

                <Button className="w-full" onClick={handleSaveMeal} disabled={items.length === 0}>Save Meal ({items.length} items)</Button>
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

// Helper Icon for Dialog
function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
