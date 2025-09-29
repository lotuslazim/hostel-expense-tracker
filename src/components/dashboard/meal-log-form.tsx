
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, writeBatch, query, where, getDocs, Timestamp, doc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Minus, Utensils, Trash2 } from "lucide-react";
import { startOfDay } from "date-fns";

interface MealLogFormProps {
  userId: string;
  groupId: string;
  dateSwitcher: React.ReactNode;
  selectedDate: Date;
  lunchMeals: number;
  dinnerMeals: number;
}

export function MealLogForm({ userId, groupId, dateSwitcher, selectedDate, lunchMeals, dinnerMeals }: MealLogFormProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleMealUpdate = async (mealType: 'lunch' | 'dinner', operation: 'add' | 'remove') => {
    setIsLoading(true);
    try {
      const todayStart = startOfDay(selectedDate);
      const mealsRef = collection(firestore, `groups/${groupId}/meals`);
      const q = query(
        mealsRef,
        where("userId", "==", userId),
        where("mealType", "==", mealType),
        where("date", ">=", Timestamp.fromDate(todayStart)),
        where("date", "<=", new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1))
      );
      
      const querySnapshot = await getDocs(q);

      if (operation === 'add') {
         await addDoc(mealsRef, {
            userId,
            groupId,
            mealType,
            mealNumber: 1,
            description: `${mealType} meal`,
            date: Timestamp.fromDate(selectedDate),
            createdAt: serverTimestamp(),
        });
        toast({ title: "Success", description: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} logged.`});
      } else { // remove
        if (!querySnapshot.empty) {
          const mealToDelete = querySnapshot.docs[0];
          await deleteDoc(doc(firestore, `groups/${groupId}/meals`, mealToDelete.id));
          toast({ title: "Success", description: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} removed.`});
        } else {
          toast({ variant: "destructive", title: "Nothing to remove."});
        }
      }

    } catch (error) {
      console.error("Error updating meal:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update meal log." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Utensils />Log Your Meals</CardTitle>
        <CardDescription>Add or remove your lunch and dinner for the selected day.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          {dateSwitcher}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <Label htmlFor="lunch-meals" className="text-lg font-medium">Lunch</Label>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleMealUpdate('lunch', 'remove')} disabled={isLoading || lunchMeals === 0}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold text-xl w-8 text-center">{lunchMeals}</span>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleMealUpdate('lunch', 'add')} disabled={isLoading}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <Label htmlFor="dinner-meals" className="text-lg font-medium">Dinner</Label>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleMealUpdate('dinner', 'remove')} disabled={isLoading || dinnerMeals === 0}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold text-xl w-8 text-center">{dinnerMeals}</span>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleMealUpdate('dinner', 'add')} disabled={isLoading}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
         {isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin"/>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
