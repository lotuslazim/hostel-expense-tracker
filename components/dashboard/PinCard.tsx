"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { Loader2, Pin } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useDoc, useUser } from "@/firebase";
import { firestore } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";

const pinSchema = z.object({
  messageText: z
    .string()
    .trim()
    .min(1, "Pinned information cannot be empty.")
    .max(200, "Pinned information cannot exceed 200 characters."),
});

type UserProfileRecord = {
  displayName?: string;
  groupId?: string | null;
};

export function PinCard() {
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUserRef = useMemo(
    () =>
      currentUser
        ? doc(firestore, "users", currentUser.uid)
        : null,
    [currentUser]
  );

  const { data: currentUserData } =
    useDoc<UserProfileRecord>(currentUserRef);

  const groupId = currentUserData?.groupId;

  const form = useForm<z.infer<typeof pinSchema>>({
    resolver: zodResolver(pinSchema),
    defaultValues: {
      messageText: "",
    },
  });

  async function onSubmit(values: z.infer<typeof pinSchema>) {
    if (!currentUser || !groupId) {
      toast({
        variant: "destructive",
        title: "Pin unavailable",
        description: "You must be in a group to pin information.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(
        collection(firestore, `groups/${groupId}/notices`),
        {
          messageText: values.messageText,
          createdBy: currentUser.uid,
          createdByName:
            currentUserData?.displayName ||
            currentUser.displayName ||
            currentUser.email?.split("@")[0] ||
            "Group member",
          createdAt: serverTimestamp(),
          groupId,
        }
      );

      toast({
        title: "Pinned to Notice Board",
        description: "Your group can now find this information from the header.",
      });

      form.reset();
    } catch (error) {
      console.error("Error pinning notice:", error);
      toast({
        variant: "destructive",
        title: "Pin failed",
        description: "Could not add this information to the Notice Board.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pin className="h-5 w-5 text-[#d8a800] dark:text-[#f6cf58]" />
          Pin
        </CardTitle>
        <CardDescription>
          Keep important information on the Notice Board.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="messageText"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="e.g., Landlord: 01XXXXXXXXX"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Pin to Board
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
