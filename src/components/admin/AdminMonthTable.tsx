"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { addDays, endOfMonth, format, startOfMonth, subDays, addMonths, subMonths } from "date-fns";
import { CalendarOff, ChevronLeft, ChevronRight, Loader2, Plus, Table2, Trash2 } from "lucide-react";

import { useCollection, useUser } from "@/firebase";
import { firestore } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import type { Expense, MealLog } from "@/lib/types";
import type { LeaveRecord } from "@/lib/electricity-split";
import { computeMonth, monthKeyOf, type AdjustField, type MonthAdjustment } from "@/lib/month-calc";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type MemberDoc = {
  id: string;
  displayName?: string;
  userName?: string;
  email?: string;
  joinedAt?: Timestamp;
  leftAt?: Timestamp | null;
};

const FIELD_LABEL: Record<AdjustField, string> = {
  meals: "Meals",
  utilities: "Utilities",
  wifi: "Wi-Fi",
  etc: "ETC",
};

const toDate = (v: unknown): Date | null =>
  v && typeof (v as { toDate?: unknown }).toDate === "function"
    ? (v as { toDate: () => Date }).toDate()
    : v instanceof Date
      ? v
      : null;

const money = (n: number) => `৳${(Math.round(n * 100) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const num = (n: number) => String(Math.round(n * 100) / 100);

const inputToDate = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export function AdminMonthTable({ groupId }: { groupId: string }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const monthStart = month;
  const monthEnd = useMemo(() => endOfMonth(month), [month]);
  const monthKey = monthKeyOf(month);

  /* ---------------- data ---------------- */
  const membersQ = useMemo(() => collection(firestore, `groups/${groupId}/members`), [groupId]);
  const mealsQ = useMemo(
    () => query(collection(firestore, `groups/${groupId}/meals`), where("date", ">=", monthStart), where("date", "<=", monthEnd)),
    [groupId, monthStart, monthEnd]
  );
  const expensesQ = useMemo(
    () => query(collection(firestore, `groups/${groupId}/expenses`), where("date", ">=", monthStart), where("date", "<=", monthEnd)),
    [groupId, monthStart, monthEnd]
  );
  const leavesQ = useMemo(() => collection(firestore, `groups/${groupId}/leaves`), [groupId]);
  const adjQ = useMemo(
    () => query(collection(firestore, `groups/${groupId}/adjustments`), where("monthKey", "==", monthKey)),
    [groupId, monthKey]
  );

  const { data: membersData, isLoading: l1 } = useCollection<MemberDoc>(membersQ);
  const { data: meals, isLoading: l2 } = useCollection<MealLog>(mealsQ);
  const { data: expenses, isLoading: l3 } = useCollection<Expense>(expensesQ);
  const { data: leaves } = useCollection<LeaveRecord>(leavesQ);
  const { data: adjustments } = useCollection<MonthAdjustment>(adjQ);

  /* members active in this month */
  const members = useMemo(
    () =>
      (membersData ?? []).filter((m) => {
        const joined = toDate(m.joinedAt);
        const left = toDate(m.leftAt);
        return (!joined || joined <= monthEnd) && (!left || left >= monthStart);
      }),
    [membersData, monthStart, monthEnd]
  );

  /* names from each member's user profile */
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      (membersData ?? []).map(async (m) => {
        try {
          const snap = await getDoc(doc(firestore, "users", m.id));
          const p = snap.exists() ? (snap.data() as { displayName?: string; email?: string }) : null;
          return [m.id, p?.displayName || m.displayName || m.userName || p?.email?.split("@")[0] || m.email?.split("@")[0] || "Member"] as const;
        } catch {
          return [m.id, m.displayName || m.userName || "Member"] as const;
        }
      })
    ).then((pairs) => {
      if (!cancelled) setNames(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
  }, [membersData]);

  const result = useMemo(
    () =>
      computeMonth({
        members,
        meals: meals ?? [],
        expenses: expenses ?? [],
        leaves: leaves ?? [],
        adjustments: adjustments ?? [],
        monthStart,
        monthEnd,
      }),
    [members, meals, expenses, leaves, adjustments, monthStart, monthEnd]
  );

  const actorName = () => user?.displayName || user?.email?.split("@")[0] || "Admin";

  /* ---------------- edit cell ---------------- */
  const [edit, setEdit] = useState<{ userId: string; field: AdjustField } | null>(null);
  const [mode, setMode] = useState<"set" | "change">("change");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const currentValue = edit ? (result.byMember[edit.userId]?.[edit.field] ?? 0) : 0;
  const parsed = Number(value);
  const delta = !value.trim() || !Number.isFinite(parsed) ? 0 : mode === "set" ? parsed - currentValue : parsed;
  const newValue = currentValue + delta;

  const openEdit = (userId: string, field: AdjustField) => {
    setEdit({ userId, field });
    setMode("change");
    setValue("");
    setReason("");
  };

  const saveEdit = async () => {
    if (!edit || !user) return;
    if (!delta) {
      toast({ title: "Nothing changed" });
      return;
    }
    if (edit.field === "meals" && newValue < 0) {
      toast({ variant: "destructive", title: "Meals cannot go below 0" });
      return;
    }

    setSaving(true);
    try {
      const batch = writeBatch(firestore);
      const adjRef = doc(collection(firestore, `groups/${groupId}/adjustments`));
      const actRef = doc(collection(firestore, `groups/${groupId}/notifications`));
      const cleanReason = reason.trim();
      const isMeals = edit.field === "meals";
      const fmt = (n: number) => (isMeals ? num(n) : money(n));
      const sign = delta > 0 ? "+" : "−";

      batch.set(adjRef, {
        userId: edit.userId,
        monthKey,
        field: edit.field,
        delta,
        reason: cleanReason,
        createdBy: user.uid,
        createdByName: actorName(),
        createdAt: serverTimestamp(),
      });

      batch.set(actRef, {
        groupId,
        recordId: adjRef.id,
        senderId: user.uid,
        senderName: actorName(),
        targetUserId: edit.userId,
        messageText: `changed ${names[edit.userId] || "Member"}'s ${FIELD_LABEL[edit.field]} for ${format(month, "MMMM yyyy")}: ${fmt(currentValue)} → ${fmt(newValue)} (${sign}${fmt(Math.abs(delta))})${cleanReason ? `. Reason: ${cleanReason}` : ""}`,
        type: "admin_adjustment",
        ...(cleanReason ? { reason: cleanReason } : {}),
        createdAt: serverTimestamp(),
        readBy: [user.uid],
      });

      await batch.commit();
      toast({ title: "Saved", description: "The change is visible in Activity Log." });
      setEdit(null);
    } catch (error) {
      console.error("Adjustment failed:", error);
      toast({ variant: "destructive", title: "Could not save", description: "Check that the new Firestore Rules are published." });
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- leave ---------------- */
  const [leaveFor, setLeaveFor] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [leaveBusy, setLeaveBusy] = useState(false);

  const leavesOf = (userId: string) =>
    (leaves ?? [])
      .filter((l) => l.userId === userId)
      .sort((a, b) => (toDate(b.startDate)?.getTime() ?? 0) - (toDate(a.startDate)?.getTime() ?? 0));

  /* leaves touching this month (end = return day) */
  const leavesInMonth = (userId: string) =>
    leavesOf(userId).filter((l) => {
      const s = toDate(l.startDate);
      const e = toDate(l.endDate);
      return s && s <= monthEnd && (!e || e > monthStart);
    });

  const leaveLabel = (l: LeaveRecord) => {
    const s = toDate(l.startDate);
    const e = toDate(l.endDate);
    if (!s) return "";
    return e ? `${format(s, "MMM d")} – ${format(subDays(e, 1), "MMM d")}` : `${format(s, "MMM d")} – ongoing`;
  };

  const logLeave = async (userId: string, text: string) => {
    if (!user) return;
    await addDoc(collection(firestore, `groups/${groupId}/notifications`), {
      groupId,
      senderId: user.uid,
      senderName: actorName(),
      targetUserId: userId,
      messageText: text,
      type: "admin_leave",
      createdAt: serverTimestamp(),
      readBy: [user.uid],
    });
  };

  const addLeave = async () => {
    if (!leaveFor || !from || !to) {
      toast({ variant: "destructive", title: "Pick both From and To dates" });
      return;
    }
    const start = inputToDate(from);
    const lastAway = inputToDate(to);
    if (lastAway < start) {
      toast({ variant: "destructive", title: "To must be on or after From" });
      return;
    }
    setLeaveBusy(true);
    try {
      await addDoc(collection(firestore, `groups/${groupId}/leaves`), {
        userId: leaveFor,
        userName: names[leaveFor] || "Member",
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(addDays(lastAway, 1)),
        createdAt: serverTimestamp(),
      });
      await logLeave(leaveFor, `added leave for ${names[leaveFor] || "Member"}: ${format(start, "MMM d")} – ${format(lastAway, "MMM d, yyyy")}`);
      setFrom("");
      setTo("");
      toast({ title: "Leave added" });
    } catch (error) {
      console.error("Add leave failed:", error);
      toast({ variant: "destructive", title: "Could not add leave", description: "Check that the new Firestore Rules are published." });
    } finally {
      setLeaveBusy(false);
    }
  };

  const endLeaveToday = async (l: LeaveRecord) => {
    if (!l.id || !leaveFor) return;
    setLeaveBusy(true);
    try {
      const t = new Date();
      await updateDoc(doc(firestore, `groups/${groupId}/leaves`, l.id), {
        endDate: Timestamp.fromDate(new Date(t.getFullYear(), t.getMonth(), t.getDate())),
        updatedAt: serverTimestamp(),
      });
      await logLeave(leaveFor, `marked ${names[leaveFor] || "Member"} as back from leave today`);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Could not update leave" });
    } finally {
      setLeaveBusy(false);
    }
  };

  const removeLeave = async (l: LeaveRecord) => {
    if (!l.id || !leaveFor) return;
    setLeaveBusy(true);
    try {
      await deleteDoc(doc(firestore, `groups/${groupId}/leaves`, l.id));
      await logLeave(leaveFor, `removed leave of ${names[leaveFor] || "Member"} (${leaveLabel(l)})`);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Could not remove leave" });
    } finally {
      setLeaveBusy(false);
    }
  };

  /* ---------------- render ---------------- */
  const loading = l1 || l2 || l3;
  const totals = members.reduce(
    (acc, m) => {
      const r = result.byMember[m.id];
      if (!r) return acc;
      acc.meals += r.meals;
      acc.bazar += r.bazar;
      acc.utilities += r.utilities;
      acc.wifi += r.wifi;
      acc.etc += r.etc;
      acc.total += r.total;
      return acc;
    },
    { meals: 0, bazar: 0, utilities: 0, wifi: 0, etc: 0, total: 0 }
  );

  const EditableCell = ({ userId, field }: { userId: string; field: AdjustField }) => {
    const r = result.byMember[userId];
    const v = r?.[field] ?? 0;
    const adjusted = (r?.adjustments[field] ?? 0) !== 0;
    return (
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={() => openEdit(userId, field)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 tabular-nums hover:bg-muted"
          title={adjusted ? `Includes admin change: ${r!.adjustments[field] > 0 ? "+" : ""}${num(r!.adjustments[field])}` : "Click to edit"}
        >
          {field === "meals" ? num(v) : money(v)}
          {adjusted && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
        </button>
      </td>
    );
  };

  const th = "px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
  const sticky = "sticky left-0 z-10 bg-card";

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Table2 className="h-5 w-5" />
              Monthly Sheet
            </CardTitle>
            <CardDescription>
              Click a number to edit it. Every change is shown in Activity Log. A dot means an admin changed that cell.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" onClick={() => setMonth((m) => subMonths(m, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[8rem] text-center font-semibold">{format(month, "MMMM yyyy")}</span>
            <Button type="button" variant="outline" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No members in this month.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className={`${th} ${sticky} text-left`}>Name</th>
                    <th className={th}>Meals</th>
                    <th className={th}>Bazar</th>
                    <th className={th}>Utilities</th>
                    <th className={th}>Wi-Fi</th>
                    <th className={th}>ETC</th>
                    <th className={th}>Total</th>
                    <th className={`${th} text-left`}>Leave</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const r = result.byMember[m.id];
                    const ml = leavesInMonth(m.id);
                    return (
                      <tr key={m.id} className="border-b last:border-0">
                        <td className={`${sticky} whitespace-nowrap px-3 py-2 font-medium`}>{names[m.id] || "…"}</td>
                        <EditableCell userId={m.id} field="meals" />
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{money(r?.bazar ?? 0)}</td>
                        <EditableCell userId={m.id} field="utilities" />
                        <EditableCell userId={m.id} field="wifi" />
                        <EditableCell userId={m.id} field="etc" />
                        <td className="px-3 py-2 text-right font-bold tabular-nums">{money(r?.total ?? 0)}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setLeaveFor(m.id)}
                            className="flex flex-wrap items-center gap-1 rounded-md px-1 py-1 text-left hover:bg-muted"
                          >
                            {ml.length === 0 ? (
                              <span className="text-xs text-muted-foreground">+ Add</span>
                            ) : (
                              ml.map((l) => (
                                <Badge key={l.id} variant="secondary" className="whitespace-nowrap">
                                  {leaveLabel(l)}
                                </Badge>
                              ))
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t bg-muted/40 font-semibold">
                  <tr>
                    <td className={`${sticky} px-3 py-3`}>Total</td>
                    <td className="px-3 py-3 text-right tabular-nums">{num(totals.meals)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{money(totals.bazar)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{money(totals.utilities)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{money(totals.wifi)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{money(totals.etc)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{money(totals.total)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>Meal rate: {money(result.mealRate)}</span>
              {result.adjustmentMoneyNet !== 0 && (
                <span>
                  Admin changes this month: {result.adjustmentMoneyNet > 0 ? "+" : "−"}
                  {money(Math.abs(result.adjustmentMoneyNet))}
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>

      {/* ---------- edit dialog ---------- */}
      <Dialog open={Boolean(edit)} onOpenChange={(o) => !o && !saving && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {edit ? `${names[edit.userId] || "Member"} · ${FIELD_LABEL[edit.field]}` : ""}
            </DialogTitle>
            <DialogDescription>
              Current: {edit ? (edit.field === "meals" ? num(currentValue) : money(currentValue)) : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={mode === "change" ? "default" : "outline"} onClick={() => setMode("change")}>
                Add / Subtract
              </Button>
              <Button type="button" size="sm" variant={mode === "set" ? "default" : "outline"} onClick={() => setMode("set")}>
                Set new value
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adj-value">{mode === "change" ? "Amount (use − to subtract, e.g. -500)" : "New value"}</Label>
              <Input
                id="adj-value"
                type="number"
                step={edit?.field === "meals" ? "0.5" : "1"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              />
              {delta !== 0 && edit && (
                <p className="text-sm">
                  New value:{" "}
                  <span className="font-semibold">
                    {edit.field === "meals" ? num(newValue) : money(newValue)}
                  </span>{" "}
                  <span className={delta > 0 ? "text-emerald-500" : "text-red-500"}>
                    ({delta > 0 ? "+" : "−"}
                    {edit.field === "meals" ? num(Math.abs(delta)) : money(Math.abs(delta))})
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adj-reason">Reason (optional)</Label>
              <Textarea
                id="adj-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={200}
                placeholder="Example: Forgot to turn off meal"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEdit(null)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveEdit()} disabled={saving || delta === 0}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- leave dialog ---------- */}
      <Dialog open={Boolean(leaveFor)} onOpenChange={(o) => !o && !leaveBusy && setLeaveFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarOff className="h-5 w-5" />
              Leave · {leaveFor ? names[leaveFor] || "Member" : ""}
            </DialogTitle>
            <DialogDescription>
              Days on leave are not counted for bills where the leave rule is on (Electricity for now).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {leaveFor && leavesOf(leaveFor).length === 0 && (
                <p className="text-sm text-muted-foreground">No leave recorded.</p>
              )}
              {leaveFor &&
                leavesOf(leaveFor).map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                    <span>{leaveLabel(l)}</span>
                    <div className="flex gap-1">
                      {!l.endDate && (
                        <Button type="button" size="sm" variant="outline" disabled={leaveBusy} onClick={() => void endLeaveToday(l)}>
                          Back today
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        disabled={leaveBusy}
                        onClick={() => void removeLeave(l)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="leave-from">From (first day away)</Label>
                <Input id="leave-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="leave-to">To (last day away)</Label>
                <Input id="leave-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLeaveFor(null)} disabled={leaveBusy}>
              Close
            </Button>
            <Button type="button" onClick={() => void addLeave()} disabled={leaveBusy}>
              {leaveBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
