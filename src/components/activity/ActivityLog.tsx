"use client";

import { useMemo, useState } from "react";
import {
  collection,
  doc,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { format } from "date-fns/format";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import {
  Activity,
  BadgeCheck,
  History,
  Loader2,
  Pencil,
  Receipt,
  RotateCcw,
  Trash2,
  ShieldCheck,
  Utensils,
} from "lucide-react";

import { useCollection, useDoc, useUser } from "@/firebase";
import { firestore } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import type { Expense, MealLog } from "@/lib/types";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ActivityRecord = {
  id: string;
  recordId?: string;
  senderId?: string;
  senderName?: string;
  targetUserId?: string;
  messageText?: string;
  type?: string;
  reason?: string;
  beforeMealNumber?: number;
  afterMealNumber?: number;
  createdAt?: Timestamp | null;
};

type UserProfile = {
  groupId?: string | null;
  displayName?: string;
  isAdmin?: boolean;
};

type GroupRecord = {
  adminId?: string;
};

type ActivityFilter = "all" | "meal" | "expense" | "admin";

const ADMIN_ACTIVITY_TYPES = [
  "meal_adjustment",
  "meal_delete",
  "expense_adjustment",
  "expense_delete",
  "admin_adjustment",
  "admin_leave",
];

const getActivityKind = (type?: string): Exclude<ActivityFilter, "all"> => {
  if (type && ADMIN_ACTIVITY_TYPES.includes(type)) {
    return "admin";
  }

  if (type?.includes("meal")) {
    return "meal";
  }

  if (type?.includes("expense")) {
    return "expense";
  }

  return "admin";
};

const getActivityIcon = (type?: string) => {
  if (type === "meal_undo" || type === "expense_undo") {
    return RotateCcw;
  }

  if (type === "meal_delete" || type === "expense_delete") {
    return Trash2;
  }

  if (type && ADMIN_ACTIVITY_TYPES.includes(type)) {
    return ShieldCheck;
  }

  if (type?.includes("meal")) {
    return Utensils;
  }

  if (type?.includes("expense")) {
    return Receipt;
  }

  return Activity;
};

const getMealDate = (meal: MealLog) =>
  meal.date instanceof Timestamp ? meal.date.toDate() : meal.date;

const getRecordDate = (value: Date | Timestamp) =>
  value instanceof Timestamp ? value.toDate() : value;

type DeleteTarget =
  | { kind: "meal"; record: MealLog }
  | { kind: "expense"; record: Expense };

export function ActivityLog() {
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [editingMeal, setEditingMeal] = useState<MealLog | null>(null);
  const [mealCount, setMealCount] = useState("");
  const [itemName, setItemName] = useState("");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [adminTab, setAdminTab] = useState<"meals" | "expenses">("meals");

  const currentUserRef = useMemo(
    () => (currentUser ? doc(firestore, "users", currentUser.uid) : null),
    [currentUser]
  );
  const { data: currentUserData, isLoading: isUserDataLoading } =
    useDoc<UserProfile>(currentUserRef);
  const groupId = currentUserData?.groupId;

  const groupRef = useMemo(
    () => (groupId ? doc(firestore, "groups", groupId) : null),
    [groupId]
  );
  const { data: groupData, isLoading: isGroupLoading } = useDoc<GroupRecord>(groupRef);
  const isAdmin = Boolean(
    currentUser && groupData?.adminId === currentUser.uid
  );

  const activitiesQuery = useMemo(() => {
    if (!groupId) {
      return null;
    }

    return query(
      collection(firestore, `groups/${groupId}/notifications`),
      orderBy("createdAt", "desc")
    );
  }, [groupId]);

  const mealsQuery = useMemo(() => {
    if (!groupId || !isAdmin) {
      return null;
    }

    return query(
      collection(firestore, `groups/${groupId}/meals`),
      orderBy("date", "desc")
    );
  }, [groupId, isAdmin]);

  const expensesQuery = useMemo(() => {
    if (!groupId || !isAdmin) {
      return null;
    }

    return query(
      collection(firestore, `groups/${groupId}/expenses`),
      orderBy("date", "desc")
    );
  }, [groupId, isAdmin]);

  const { data: expenses, isLoading: areExpensesLoading } =
    useCollection<Expense>(expensesQuery);

  const {
    data: activities,
    isLoading: areActivitiesLoading,
    error: activitiesError,
  } = useCollection<ActivityRecord>(activitiesQuery);
  const { data: meals, isLoading: areMealsLoading } =
    useCollection<MealLog>(mealsQuery);

  const filteredActivities = useMemo(() => {
    if (filter === "all") {
      return activities ?? [];
    }

    return (activities ?? []).filter(
      (activity) => getActivityKind(activity.type) === filter
    );
  }, [activities, filter]);

  const openMealEditor = (meal: MealLog) => {
    setEditingMeal(meal);
    setMealCount(String(meal.mealNumber));
    setItemName(meal.itemName ?? "");
    setReason("");
  };

  const closeMealEditor = () => {
    if (isSaving) {
      return;
    }

    setEditingMeal(null);
    setMealCount("");
    setItemName("");
    setReason("");
  };

  const saveMealCorrection = async () => {
    if (!currentUser || !groupId || !isAdmin || !editingMeal) {
      return;
    }

    const nextMealCount = Number(mealCount);
    const correctionReason = reason.trim();

    if (!Number.isFinite(nextMealCount) || nextMealCount < 0 || nextMealCount > 100) {
      toast({
        variant: "destructive",
        title: "Invalid meal count",
        description: "Meal count must be between 0 and 100.",
      });
      return;
    }

    if (correctionReason.length < 5 || correctionReason.length > 200) {
      toast({
        variant: "destructive",
        title: "Reason required",
        description: "Write a clear reason between 5 and 200 characters.",
      });
      return;
    }

    const actorName =
      currentUserData?.displayName ||
      currentUser.displayName ||
      currentUser.email?.split("@")[0] ||
      "Admin";
    const memberName = editingMeal.userName || "Member";
    const previousMealCount = editingMeal.mealNumber;
    const previousItemName = editingMeal.itemName?.trim() || null;
    const nextItemName = itemName.trim() || null;

    if (
      previousMealCount === nextMealCount
      && previousItemName === nextItemName
    ) {
      toast({
        title: "Nothing changed",
        description: "Change the meal count or item name before saving.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const batch = writeBatch(firestore);
      const mealRef = doc(
        firestore,
        `groups/${groupId}/meals`,
        editingMeal.id
      );
      const activityRef = doc(
        collection(firestore, `groups/${groupId}/notifications`)
      );

      batch.update(mealRef, {
        mealNumber: nextMealCount,
        itemName: nextItemName,
        description: `${nextMealCount} ${editingMeal.mealType}(s) logged.${nextItemName ? ` Item: ${nextItemName}` : ""}`,
        updatedAt: serverTimestamp(),
        lastEditedBy: currentUser.uid,
        lastEditedByName: actorName,
        lastEditedAt: serverTimestamp(),
        editReason: correctionReason,
        lastActivityId: activityRef.id,
      });

      batch.set(activityRef, {
        groupId,
        recordId: editingMeal.id,
        senderId: currentUser.uid,
        senderName: actorName,
        targetUserId: editingMeal.userId,
        messageText: `corrected ${memberName}'s ${editingMeal.mealType} on ${format(getMealDate(editingMeal), "MMM d, yyyy")}: x${previousMealCount} → x${nextMealCount}. Reason: ${correctionReason}`,
        type: "meal_adjustment",
        reason: correctionReason,
        beforeMealNumber: previousMealCount,
        afterMealNumber: nextMealCount,
        createdAt: serverTimestamp(),
        readBy: [currentUser.uid],
      });

      await batch.commit();

      toast({
        title: "Meal corrected",
        description: "The correction and its reason are now visible in Activity Log.",
      });
      setEditingMeal(null);
      setMealCount("");
      setItemName("");
      setReason("");
    } catch (error) {
      console.error("Meal correction failed:", error);
      toast({
        variant: "destructive",
        title: "Correction failed",
        description: "The meal was not changed. Check your admin permission and try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getActorName = () =>
    currentUserData?.displayName ||
    currentUser?.displayName ||
    currentUser?.email?.split("@")[0] ||
    "Admin";

  const validateReason = () => {
    const correctionReason = reason.trim();

    if (correctionReason.length < 5 || correctionReason.length > 200) {
      toast({
        variant: "destructive",
        title: "Reason required",
        description: "Write a clear reason between 5 and 200 characters.",
      });
      return null;
    }

    return correctionReason;
  };

  const openExpenseEditor = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseAmount(String(expense.amount));
    setReason("");
  };

  const closeExpenseEditor = () => {
    if (isSaving) {
      return;
    }

    setEditingExpense(null);
    setExpenseAmount("");
    setReason("");
  };

  const saveExpenseCorrection = async () => {
    if (!currentUser || !groupId || !isAdmin || !editingExpense) {
      return;
    }

    const nextAmount = Number(expenseAmount);

    if (!Number.isFinite(nextAmount) || nextAmount < 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Amount must be 0 or more.",
      });
      return;
    }

    const correctionReason = validateReason();
    if (!correctionReason) {
      return;
    }

    if (nextAmount === editingExpense.amount) {
      toast({
        title: "Nothing changed",
        description: "Change the amount before saving.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const actorName = getActorName();
      const batch = writeBatch(firestore);
      const expenseRef = doc(firestore, `groups/${groupId}/expenses`, editingExpense.id);
      const activityRef = doc(collection(firestore, `groups/${groupId}/notifications`));

      batch.update(expenseRef, {
        amount: nextAmount,
        updatedAt: serverTimestamp(),
        lastEditedBy: currentUser.uid,
        lastEditedByName: actorName,
        lastEditedAt: serverTimestamp(),
        editReason: correctionReason,
        lastActivityId: activityRef.id,
      });

      batch.set(activityRef, {
        groupId,
        recordId: editingExpense.id,
        senderId: currentUser.uid,
        senderName: actorName,
        targetUserId: editingExpense.userId,
        messageText: `corrected ${editingExpense.userName || "Member"}'s expense "${editingExpense.expenseItem}" on ${format(getRecordDate(editingExpense.date), "MMM d, yyyy")}: ৳${editingExpense.amount} → ৳${nextAmount}. Reason: ${correctionReason}`,
        type: "expense_adjustment",
        reason: correctionReason,
        createdAt: serverTimestamp(),
        readBy: [currentUser.uid],
      });

      await batch.commit();

      toast({
        title: "Expense corrected",
        description: "The correction and its reason are now visible in Activity Log.",
      });
      setEditingExpense(null);
      setExpenseAmount("");
      setReason("");
    } catch (error) {
      console.error("Expense correction failed:", error);
      toast({
        variant: "destructive",
        title: "Correction failed",
        description: "The expense was not changed. Check your admin permission and try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDialog = (target: DeleteTarget) => {
    setDeleteTarget(target);
    setReason("");
  };

  const closeDeleteDialog = () => {
    if (isSaving) {
      return;
    }

    setDeleteTarget(null);
    setReason("");
  };

  const confirmDelete = async () => {
    if (!currentUser || !groupId || !isAdmin || !deleteTarget) {
      return;
    }

    const correctionReason = validateReason();
    if (!correctionReason) {
      return;
    }

    setIsSaving(true);

    try {
      const actorName = getActorName();
      const { kind, record } = deleteTarget;
      const collectionName = kind === "meal" ? "meals" : "expenses";
      const batch = writeBatch(firestore);

      // Fixed ID so Firestore Rules can verify that every admin delete is logged.
      const activityRef = doc(
        firestore,
        `groups/${groupId}/notifications`,
        `admin_delete_${record.id}`
      );

      const label =
        kind === "meal"
          ? `${(record as MealLog).mealType} x${(record as MealLog).mealNumber}`
          : `expense "${(record as Expense).expenseItem}" (৳${(record as Expense).amount})`;

      batch.set(activityRef, {
        groupId,
        recordId: record.id,
        senderId: currentUser.uid,
        senderName: actorName,
        targetUserId: record.userId,
        messageText: `deleted ${record.userName || "Member"}'s ${label} on ${format(getRecordDate(record.date), "MMM d, yyyy")}. Reason: ${correctionReason}`,
        type: kind === "meal" ? "meal_delete" : "expense_delete",
        reason: correctionReason,
        createdAt: serverTimestamp(),
        readBy: [currentUser.uid],
      });

      batch.delete(doc(firestore, `groups/${groupId}/${collectionName}`, record.id));

      await batch.commit();

      toast({
        title: kind === "meal" ? "Meal deleted" : "Expense deleted",
        description: "The deletion and its reason are now visible in Activity Log.",
      });
      setDeleteTarget(null);
      setReason("");
    } catch (error) {
      console.error("Admin delete failed:", error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Nothing was deleted. Check your admin permission and try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isUserDataLoading || isGroupLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-[34rem] w-full rounded-xl" />
      </div>
    );
  }

  if (!currentUser || !groupId) {
    return (
      <Alert>
        <AlertTitle>Activity Log unavailable</AlertTitle>
        <AlertDescription>Join or create a group to view member activity.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="flex items-center gap-3 font-headline text-2xl font-semibold tracking-tight md:text-3xl">
          <span className="bb-page-title-icon">
            <History className="h-5 w-5" />
          </span>
          Activity Log
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everyone in the group can see who recorded, undid, or corrected an entry.
        </p>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Group history</CardTitle>
            <CardDescription>Complete recorded activity, newest first.</CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "meal", "expense", "admin"] as ActivityFilter[]).map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={filter === item ? "default" : "outline"}
                onClick={() => setFilter(item)}
                className="capitalize"
              >
                {item}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {activitiesError ? (
            <Alert variant="destructive">
              <AlertTitle>Activity could not be loaded</AlertTitle>
              <AlertDescription>
                Check the deployed Firestore Rules and try again.
              </AlertDescription>
            </Alert>
          ) : areActivitiesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredActivities.length > 0 ? (
            <ScrollArea className="h-[min(65vh,44rem)] pr-3">
              <div className="space-y-2">
                {filteredActivities.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  const activityDate = activity.createdAt?.toDate();

                  return (
                    <article
                      key={activity.id}
                      className="flex items-start gap-3 rounded-lg border bg-card p-3"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted",
                          activity.type === "meal_adjustment" && "bg-primary/10 text-primary"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">
                            {activity.senderName || "Member"}
                          </p>
                          <Badge variant="outline" className="capitalize">
                            {(activity.type || "activity").replaceAll("_", " ")}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {activity.messageText || "Recorded an activity"}
                        </p>
                        {activityDate && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {format(activityDate, "MMM d, yyyy · h:mm a")} · {formatDistanceToNow(activityDate, { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              <History className="mx-auto mb-3 h-10 w-10 opacity-60" />
              <p>No matching activity yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader className="gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5" />
                Admin corrections
              </CardTitle>
              <CardDescription>
                Correct or delete any member&apos;s meal or expense. A reason is mandatory and becomes visible to everyone.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["meals", "expenses"] as const).map((tab) => (
                <Button
                  key={tab}
                  type="button"
                  size="sm"
                  variant={adminTab === tab ? "default" : "outline"}
                  onClick={() => setAdminTab(tab)}
                  className="capitalize"
                >
                  {tab}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {adminTab === "meals" ? (
              areMealsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : meals && meals.length > 0 ? (
                <ScrollArea className="h-[min(60vh,36rem)] pr-3">
                  <div className="space-y-2">
                    {meals.map((meal) => (
                      <div
                        key={meal.id}
                        className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold">
                            {meal.userName || "Member"} · <span className="capitalize">{meal.mealType}</span> x{meal.mealNumber}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(getMealDate(meal), "MMM d, yyyy")}
                            {meal.itemName ? ` · ${meal.itemName}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openMealEditor(meal)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Correct
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog({ kind: "meal", record: meal })}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No meal records are available to correct.
                </p>
              )
            ) : areExpensesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : expenses && expenses.length > 0 ? (
              <ScrollArea className="h-[min(60vh,36rem)] pr-3">
                <div className="space-y-2">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold">
                          {expense.userName || "Member"} · {expense.expenseItem} · ৳{expense.amount}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(getRecordDate(expense.date), "MMM d, yyyy")} · {expense.category}
                          {expense.editReason ? " · edited" : ""}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openExpenseEditor(expense)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Correct
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog({ kind: "expense", record: expense })}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No expense records are available to correct.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(editingMeal)} onOpenChange={(open) => !open && closeMealEditor()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Correct meal record</DialogTitle>
            <DialogDescription>
              This change and your reason will appear in the shared Activity Log.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meal-count">Meal count</Label>
              <Input
                id="meal-count"
                type="number"
                min="0"
                step="0.25"
                value={mealCount}
                onChange={(event) => setMealCount(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meal-item">Item name (optional)</Label>
              <Input
                id="meal-item"
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correction-reason">Reason for correction</Label>
              <Textarea
                id="correction-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Example: Member entered 2 meals instead of 1"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">Required · 5–200 characters</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeMealEditor} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveMealCorrection()} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save correction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(editingExpense)} onOpenChange={(open) => !open && closeExpenseEditor()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Correct expense</DialogTitle>
            <DialogDescription>
              {editingExpense
                ? `${editingExpense.userName || "Member"} · ${editingExpense.expenseItem} · currently ৳${editingExpense.amount}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-amount">New amount (৳)</Label>
              <Input
                id="expense-amount"
                type="number"
                min="0"
                step="1"
                value={expenseAmount}
                onChange={(event) => setExpenseAmount(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">Set 0 to cancel the cost without deleting the record.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-reason">Reason for correction</Label>
              <Textarea
                id="expense-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Example: Wrong amount entered, actual bill was ৳250"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">Required · 5–200 characters</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeExpenseEditor} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveExpenseCorrection()} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save correction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {deleteTarget?.kind === "meal" ? "meal" : "expense"} record?
            </DialogTitle>
            <DialogDescription>
              This cannot be undone. The deletion and your reason will appear in the shared Activity Log.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="delete-reason">Reason for deleting</Label>
            <Textarea
              id="delete-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Example: Duplicate entry"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">Required · 5–200 characters</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDeleteDialog} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDelete()} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
