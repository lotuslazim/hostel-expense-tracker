
"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFirebase, useUser, useDoc } from "@/firebase";
import { doc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bell } from "lucide-react";

const reminderSchema = z.object({
  messageText: z.string().min(1, "Reminder message cannot be empty.").max(150, "Reminder cannot exceed 150 characters."),
});

export function SendReminderCard() {
  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData } = useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const form = useForm<z.infer<typeof reminderSchema>>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      messageText: "",
    },
  });

  async function onSubmit(values: z.infer<typeof reminderSchema>) {
    if (!currentUser || !groupId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be in a group to send a reminder.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const reminderCollectionRef = collection(firestore, `groups/${groupId}/reminders`);
      await addDoc(reminderCollectionRef, {
        messageText: values.messageText,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0],
        createdAt: serverTimestamp(),
        groupId,
      });

      toast({
        title: "Reminder Sent!",
        description: "All group members have been notified.",
      });
      form.reset();

    } catch (error) {
      console.error("Error sending reminder:", error);
      toast({
        variant: "destructive",
        title: "Sending Failed",
        description: "Could not send your reminder. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bell /> Send a Reminder</CardTitle>
        <CardDescription>
          Notify all group members instantly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="messageText"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="e.g., I won't be having dinner tonight." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reminder
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    