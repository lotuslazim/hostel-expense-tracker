"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Bell,
  Loader2,
  ShieldCheck,
} from "lucide-react";
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
import {
  useDoc,
  useUser,
} from "@/firebase";
import { firestore } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";

const reminderSchema = z.object({
  messageText: z
    .string()
    .trim()
    .min(1, "Notice cannot be empty.")
    .max(150, "Notice cannot exceed 150 characters."),
});

type UserProfileRecord = {
  groupId?: string | null;
};

type GroupRecord = {
  adminId?: string;
  noticeBoardMemberAccess?: boolean;
};

export function SendReminderCard() {
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUserRef = useMemo(
    () => (currentUser ? doc(firestore, "users", currentUser.uid) : null),
    [currentUser]
  );
  const { data: currentUserData, isLoading: isUserDataLoading } =
    useDoc<UserProfileRecord>(currentUserRef);

  const groupId = currentUserData?.groupId;
  const groupRef = useMemo(
    () => (groupId ? doc(firestore, "groups", groupId) : null),
    [groupId]
  );
  const { data: groupData, isLoading: isGroupDataLoading } =
    useDoc<GroupRecord>(groupRef);

  // Match the Firestore admin check: groups/{groupId}.adminId is authoritative.
  const isAdmin = Boolean(
    currentUser && groupData?.adminId === currentUser.uid
  );
  const canPostNotice =
    isAdmin || groupData?.noticeBoardMemberAccess === true;

  const form = useForm<z.infer<typeof reminderSchema>>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      messageText: "",
    },
  });

  async function onSubmit(values: z.infer<typeof reminderSchema>) {
    if (!currentUser || !groupId || !canPostNotice) {
      toast({
        variant: "destructive",
        title: "Admin permission required",
        description: "Only an admin can post notices while the board is locked.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(firestore, "groups", groupId, "reminders"), {
        messageText: values.messageText.trim(),
        senderId: currentUser.uid,
        senderName:
          currentUser.displayName ||
          currentUser.email?.split("@")[0] ||
          "Group member",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        groupId,
        isPinned: true,
      });

      toast({
        title: "Notice pinned",
        description: "Group members will see it on the Notice Board.",
      });
      form.reset();
    } catch (error) {
      console.error("Error posting notice:", error);
      toast({
        variant: "destructive",
        title: "Posting failed",
        description: "Check your Notice Board permission and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isUserDataLoading || isGroupDataLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (currentUser && groupId && !canPostNotice) {
    return (
      <Card className="border-[#f6cf58]/15 bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#f6cf58]" />
            Admin-managed Notice Board
          </CardTitle>
          <CardDescription>
            Your group admin has limited posting and editing to admins.
            You can still read every notice from the Notice Board.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Post a Notice
        </CardTitle>
        <CardDescription>
          Pin an announcement for everyone in your group.
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
                    <Input
                      placeholder="e.g., Dinner will be served at 9:00 PM."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isSubmitting || !currentUser || !groupId}
              className="w-full"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Pin Notice
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
