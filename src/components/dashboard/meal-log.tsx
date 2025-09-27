
"use client";

import type { Meal, MealType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PlusCircle, Utensils, Sandwich, Soup, Cookie } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const mealIcons: Record<MealType, React.ReactNode> = {
  breakfast: <Utensils className="h-6 w-6 text-muted-foreground" />,
  lunch: <Sandwich className="h-6 w-6 text-muted-foreground" />,
  dinner: <Soup className="h-6 w-6 text-muted-foreground" />,
  snack: <Cookie className="h-6 w-6 text-muted-foreground" />,
};

function LogMealDialog({ type, onMealLogged, currentDate }: { type: MealType; onMealLogged: () => void; currentDate: Date }) {
    const [open, setOpen] = useState(false);
    const [description, setDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    
    const { firestore } = useFirebase();
    const { user: currentUser } = useUser();
    const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserData } = useDoc(currentUserRef);
    const groupId = currentUserData?.groupId;

    const handleSaveMeal = async () => {
        if (description.length === 0 || !groupId || !currentUser) {
            toast({ variant: "destructive", title: "Error", description: "Could not save meal. Missing information." });
            return;
        }
        setIsSaving(true);
        
        const mealData = {
            userId: currentUser.uid,
            userName: currentUser.displayName || currentUser.email?.split('@')[0],
            groupId,
            mealType: type,
            description: description,
            date: serverTimestamp(),
            createdAt: serverTimestamp(),
        };

        try {
            const mealsCol = collection(firestore, `groups/${groupId}/meals`);
            await addDoc(mealsCol, {
              ...mealData,
              date: currentDate,
            });

            onMealLogged();
            setDescription("");
            setOpen(false);
            toast({ title: "Success", description: "Meal logged successfully." });

        } catch (error) {
            console.error("Error saving meal:", error);
            toast({ variant: "destructive", title: "Save Failed", description: "There was a problem saving your meal." });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
           <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Log Meal
              </Button>
           </DialogTrigger>
           <DialogContent>
              <DialogHeader>
                <DialogTitle>Log {type}</DialogTitle>
                <DialogDescription>What did you have for {type}?</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                 <div className="space-y-2">
                   <Label htmlFor={`description-${type}`}>Description</Label>
                   <Input 
                        id={`description-${type}`}
                        placeholder="e.g., Rice, Dal, Chicken Curry"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <Button className="w-full" onClick={handleSaveMeal} disabled={isSaving || description.length === 0}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Meal
                </Button>
              </div>
           </DialogContent>
         </Dialog>
    );
}


export function MealLog({ meals, currentDate }: { meals: Meal[], currentDate: Date }) {
  // A simple way to force re-render, could be improved with better state management
  const [, setVersion] = useState(0);

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
                 <LogMealDialog type={type} currentDate={currentDate} onMealLogged={() => setVersion(v => v + 1)} />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
