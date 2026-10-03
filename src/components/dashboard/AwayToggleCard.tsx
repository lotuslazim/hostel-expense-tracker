"use client";

import { useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { format } from "date-fns";
import { Home, Loader2, Plane } from "lucide-react";

import { useCollection, useDoc, useUser } from "@/firebase";
import { firestore } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import type { LeaveRecord } from "@/lib/electricity-split";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type UserProfile = { displayName?: string };

const todayInputValue = () => format(new Date(), "yyyy-MM-dd");

const inputToDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const toDate = (value: unknown): Date | null =>
  value && typeof (value as { toDate?: unknown }).toDate === "function"
    ? (value as { toDate: () => Date }).toDate()
    : null;

export function AwayToggleCard({ groupId }: { groupId: string }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [leaveDate, setLeaveDate] = useState(todayInputValue());
  const [isSaving, setIsSaving] = useState(false);

  const userRef = useMemo(
    () => (user ? doc(firestore, "users", user.uid) : null),
    [user]
  );
  const { data: profile } = useDoc<UserProfile>(userRef);

  const leavesQuery = useMemo(
    () =>
      user
        ? query(
            collection(firestore, `groups/${groupId}/leaves`),
            where("userId", "==", user.uid)
          )
        : null,
    [groupId, user]
  );
  const { data: myLeaves, isLoading } = useCollection<LeaveRecord>(leavesQuery);

  const activeLeave = (myLeaves ?? []).find((leave) => !leave.endDate);
  const isAway = Boolean(activeLeave);
  const awaySince = activeLeave ? toDate(activeLeave.startDate) : null;

  const handleToggle = async (turnOn: boolean) => {
    if (!user || isSaving) return;
    setIsSaving(true);

    try {
      if (turnOn) {
        if (!leaveDate) {
          toast({ variant: "destructive", title: "Pick the date you are leaving" });
          return;
        }

        await addDoc(collection(firestore, `groups/${groupId}/leaves`), {
          userId: user.uid,
          userName: profile?.displayName || user.displayName || user.email?.split("@")[0] || "Member",
          startDate: Timestamp.fromDate(inputToDate(leaveDate)),
          endDate: null,
          createdAt: serverTimestamp(),
        });

        toast({
          title: "Marked as away",
          description: "Electricity bills during this time will be shared by the others.",
        });
      } else if (activeLeave?.id) {
        const today = new Date();
        await updateDoc(doc(firestore, `groups/${groupId}/leaves`, activeLeave.id), {
          endDate: Timestamp.fromDate(new Date(today.getFullYear(), today.getMonth(), today.getDate())),
          updatedAt: serverTimestamp(),
        });

        toast({ title: "Welcome back!", description: "You are counted in the electricity bill again from today." });
        setLeaveDate(todayInputValue());
      }
    } catch (error) {
      console.error("Away toggle failed:", error);
      toast({
        variant: "destructive",
        title: "Could not update",
        description: "Please try again. If it keeps failing, check the Firestore Rules.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {isAway ? <Plane className="h-5 w-5" /> : <Home className="h-5 w-5" />}
          {isAway ? "You are away" : "At home"}
        </CardTitle>
        <CardDescription>
          Turn on when you leave. Electricity bills while you are away are split among the others.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <div>
            <p className="font-medium">Away / On leave</p>
            <p className="text-sm text-muted-foreground">
              {isAway && awaySince
                ? `Since ${format(awaySince, "MMM d, yyyy")}`
                : "Currently counted in the electricity bill"}
            </p>
          </div>
          {isLoading || isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Switch checked={isAway} onCheckedChange={(checked) => void handleToggle(checked)} />
          )}
        </div>

        {!isAway && (
          <div className="space-y-2">
            <Label htmlFor="leave-date">Leaving from</Label>
            <Input
              id="leave-date"
              type="date"
              value={leaveDate}
              onChange={(event) => setLeaveDate(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The leaving day is not counted. The day you turn this off is counted again.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
