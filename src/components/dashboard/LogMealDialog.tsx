
"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useFirebase, useUser, useDoc } from "@/firebase";
import { doc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { MealType } from "@/lib/types";

interface LogMealDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const mealSchema = z.object({
  mealType: z.enum(["lunch", "dinner"], {
    required_error: "You need to select a meal type.",
  }),
  mealCount: z.coerce.number().min(1, "Meal count must be at least 1.").max(5, "Meal count cannot exceed 5."),
});

export function LogMealDialog({ isOpen, setIsOpen }: LogMealDialogProps) {
  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData } = useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const form = useForm<z.infer<typeof mealSchema>>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      mealCount: 1,
    },
  });

  async function onSubmit(values: z.infer<typeof mealSchema>) {
    if (!currentUser || !groupId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be in a group to log a meal.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, `groups/${groupId}/meals`), {
        mealType: values.mealType,
        mealNumber: values.mealCount,
        description: `${values.mealCount} ${values.mealType}(s) logged.`,
        date: new Date(),
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Meal Logged",
        description: `Your ${values.mealType} has been successfully logged.`,
      });
      form.reset({ mealCount: 1 });
      setIsOpen(false);
    } catch (error) {
      console.error("Error logging meal:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not log meal. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log a Meal</DialogTitle>
          <DialogDescription>
            Select the meal type and count for today.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="mealType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Meal Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="lunch" />
                        </FormControl>
                        <FormLabel className="font-normal">Lunch</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="dinner" />
                        </FormControl>
                        <FormLabel className="font-normal">Dinner</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mealCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal Count</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Meal
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
