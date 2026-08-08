"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { BookOpen, Loader2 } from "lucide-react";

import { firestore } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserManualReminderProps {
  userId: string;
  onboardingComplete: boolean;
  hasSeenReminder: boolean;
}

export function UserManualReminder({
  userId,
  onboardingComplete,
  hasSeenReminder,
}: UserManualReminderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(
    onboardingComplete && !hasSeenReminder
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsOpen(onboardingComplete && !hasSeenReminder);
  }, [hasSeenReminder, onboardingComplete, userId]);

  if (!onboardingComplete || hasSeenReminder) {
    return null;
  }

  const markReminderSeen = async () => {
    await setDoc(
      doc(firestore, "users", userId),
      { userManualReminderSeenAt: serverTimestamp() },
      { merge: true }
    );
  };

  const dismissReminder = async () => {
    setIsOpen(false);
    setIsSaving(true);

    try {
      await markReminderSeen();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not save your choice",
        description: "The reminder may appear again next time.",
      });
      console.error("User Manual reminder error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const openManual = async () => {
    setIsSaving(true);

    try {
      await markReminderSeen();
      setIsOpen(false);
      router.push("/user-manual");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not open the User Manual",
        description: "Please try again.",
      });
      console.error("User Manual reminder error:", error);
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSaving) {
          void dismissReminder();
        }
      }}
    >
      <DialogContent className="w-[calc(100%-2rem)] max-w-md overflow-hidden border-amber-400/30 bg-background p-0">
        <div className="h-1.5 bg-gradient-to-r from-[#f2c94c] via-[#d86f8b] to-[#7f1d3d]" />

        <div className="space-y-5 p-6 pt-4">
          <DialogHeader className="text-left">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-400">
              <BookOpen className="h-6 w-6" />
            </div>

            <DialogTitle className="text-xl">Need help getting started?</DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-6">
              Visit the User Manual for simple, step-by-step guidance. It explains what each option does and how to use it.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              onClick={() => void openManual()}
              disabled={isSaving}
              className="w-full bg-[#f2c94c] text-[#251c06] hover:bg-[#e4b93f] sm:w-auto"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BookOpen className="mr-2 h-4 w-4" />
              )}
              Open User Manual
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
