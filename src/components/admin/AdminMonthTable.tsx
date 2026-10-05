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
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { addDays, addMonths, endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";
import {
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  LockOpen,
  Plus,
  Settings2,
  Table2,
  Trash2,
} from "lucide-react";

import { useCollection, useDoc, useUser } from "@/firebase";
import { firestore } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import type { Expense, MealLog } from "@/lib/types";
import type { LeaveRecord } from "@/lib/electricity-split";
import {
  BILL_TYPES,
  computeMonth,
  DEFAULT_LEAVE_CATEGORIES,
  LEAVE_BILL_TYPES,
  monthKeyOf,
  type AdjustField,
  type BillType,
  type MonthAdjustment,
  type MonthSettings,
  type SheetSettings,
} from "@/lib/month-calc";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

type LeaveDoc = LeaveRecord & { addedByAdmin?: boolean };

const FIELD_LABEL: Record<AdjustField, string> = {
  meals: "Meals",
  bazar: "Bazar",
  utilities: "Utilities",
  wifi: "Wi-Fi",
  etc: "ETC",
};

const BILL_LABEL: Record<BillType, string> = {
  Electricity: "Electricity",
  Gas: "Gas",
  "Wi-Fi": "Wi-Fi",
  Other: "ETC",
};

const toDate = (v: unknown): Date | null =>
  v && typeof (v as { toDate?: unknown }).toDate === "function"
    ? (v as { toDate: () => Date }).toDate()
    : v instanceof Date
      ? v
      : null;

const round2 = (n: number) => Math.round(n * 100) / 100;
const money = (n: number) => `৳${Math.round(n).toLocaleString("en-US")}`;
const num = (n: number) => String(round2(n));
const toInput = (d: Date | null) => (d ? format(d, "yyyy-MM-dd") : "");
const fromInput = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/* A leave is real only if it lasts at least one day (end = return day). */
const isRealLeave = (l: LeaveRecord) => {
  const s = toDate(l.startDate);
  const e = toDate(l.endDate);
  return Boolean(s) && (!e || e > s!);
};

export function AdminMonthTable({ groupId }: { groupId: string }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const monthStart = month;
  const monthEnd = useMemo(() => endOfMonth(month), [month]);
  const monthKey = monthKeyOf(month);
  const actorName = () => user?.displayName || user?.email?.split("@")[0] || "Admin";

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
  const sheetSettingsRef = useMemo(() => doc(firestore, `groups/${groupId}/sheetSettings`, "default"), [groupId]);
  const monthSettingsRef = useMemo(() => doc(firestore, `groups/${groupId}/monthSettings`, monthKey), [groupId, monthKey]);

  const { data: membersData, isLoading: l1 } = useCollection<MemberDoc>(membersQ);
  const { data: meals, isLoading: l2 } = useCollection<MealLog>(mealsQ);
  const { data: expenses, isLoading: l3 } = useCollection<Expense>(expensesQ);
  const { data: leavesRaw } = useCollection<LeaveDoc>(leavesQ);
  const { data: adjustments } = useCollection<MonthAdjustment>(adjQ);
  const { data: sheetSettings } = useDoc<SheetSettings>(sheetSettingsRef);
  const { data: monthSettings } = useDoc<MonthSettings>(monthSettingsRef);

  const leaves = useMemo(() => (leavesRaw ?? []).filter(isRealLeave), [leavesRaw]);
  const leaveCategories = sheetSettings?.leaveCategories ?? DEFAULT_LEAVE_CATEGORIES;
  const splitMembers = monthSettings?.splitMembers ?? {};
  const locked = Boolean(monthSettings?.locked);

  const members = useMemo(
    () =>
      (membersData ?? []).filter((m) => {
        const joined = toDate(m.joinedAt);
        const left = toDate(m.leftAt);
        return (!joined || joined <= monthEnd) && (!left || left >= monthStart);
      }),
    [membersData, monthStart, monthEnd]
  );

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
        leaves,
        adjustments: adjustments ?? [],
        monthStart,
        monthEnd,
        leaveCategories,
        splitMembers,
      }),
    [members, meals, expenses, leaves, adjustments, monthStart, monthEnd, leaveCategories, splitMembers]
  );

  const logActivity = async (type: string, text: string, extra: Record<string, unknown> = {}) => {
    if (!user) return;
    await addDoc(collection(firestore, `groups/${groupId}/notifications`), {
      groupId,
      senderId: user.uid,
      senderName: actorName(),
      messageText: text.slice(0, 500),
      type,
      createdAt: serverTimestamp(),
      readBy: [user.uid],
      ...extra,
    });
  };

  const guardLocked = () => {
    if (locked) {
      toast({ variant: "destructive", title: "This month is locked", description: "Unlock it first to make changes." });
      return true;
    }
    return false;
  };

  /* ================= cell edit ================= */
  const [edit, setEdit] = useState<{ userId: string; field: AdjustField } | null>(null);
  const [mode, setMode] = useState<"change" | "set">("change");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const currentValue = edit ? (result.byMember[edit.userId]?.[edit.field] ?? 0) : 0;
  const parsed = Number(value);
  const delta = !value.trim() || !Number.isFinite(parsed) ? 0 : mode === "set" ? parsed - currentValue : parsed;
  const newValue = currentValue + delta;
  const fmtField = (field: AdjustField, n: number) => (field === "meals" ? num(n) : money(n));

  const openEdit = (userId: string, field: AdjustField) => {
    if (guardLocked()) return;
    setEdit({ userId, field });
    setMode("change");
    setValue("");
    setReason("");
  };

  const saveEdit = async () => {
    if (!edit || !user || !delta) return;
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
      const who = names[edit.userId] || "Member";

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
        messageText: `changed ${who}'s ${FIELD_LABEL[edit.field]} for ${format(month, "MMMM yyyy")}: ${fmtField(edit.field, currentValue)} → ${fmtField(edit.field, newValue)} (${delta > 0 ? "+" : "−"}${fmtField(edit.field, Math.abs(delta))})${cleanReason ? `. Reason: ${cleanReason}` : ""}`.slice(0, 500),
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

  /* ================= leave ================= */
  const [leaveFor, setLeaveFor] = useState<string | null>(null);
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { from: string; to: string }>>({});
  const [leaveBusy, setLeaveBusy] = useState(false);

  const leavesOf = (userId: string) =>
    leaves
      .filter((l) => l.userId === userId)
      .sort((a, b) => (toDate(b.startDate)?.getTime() ?? 0) - (toDate(a.startDate)?.getTime() ?? 0));

  /* days away inside the shown month */
  const daysAwayInMonth = (userId: string) => {
    const mine = leavesOf(userId);
    if (mine.length === 0) return 0;
    let count = 0;
    const last = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate());
    for (let d = new Date(monthStart); d <= last; d = addDays(d, 1)) {
      if (
        mine.some((l) => {
          const s = toDate(l.startDate)!;
          const e = toDate(l.endDate);
          const s0 = new Date(s.getFullYear(), s.getMonth(), s.getDate());
          const e0 = e ? new Date(e.getFullYear(), e.getMonth(), e.getDate()) : null;
          return d >= s0 && (!e0 || d < e0);
        })
      )
        count += 1;
    }
    return count;
  };

  const openLeave = (userId: string) => {
    setLeaveFor(userId);
    setNewFrom("");
    setNewTo("");
    setDrafts(
      Object.fromEntries(
        leavesOf(userId).map((l) => [
          l.id!,
          { from: toInput(toDate(l.startDate)), to: toDate(l.endDate) ? toInput(subDays(toDate(l.endDate)!, 1)) : "" },
        ])
      )
    );
  };

  const leaveLabel = (l: LeaveRecord) => {
    const s = toDate(l.startDate);
    const e = toDate(l.endDate);
    if (!s) return "";
    return e ? `${format(s, "MMM d")} – ${format(subDays(e, 1), "MMM d")}` : `${format(s, "MMM d")} – ongoing`;
  };

  const validRange = (from: string, to: string, allowOpenEnd: boolean) => {
    if (!from || (!to && !allowOpenEnd)) {
      toast({ variant: "destructive", title: "Pick the From and To dates" });
      return false;
    }
    if (to && fromInput(to) < fromInput(from)) {
      toast({ variant: "destructive", title: "To must be on or after From" });
      return false;
    }
    return true;
  };

  const addLeave = async () => {
    if (!leaveFor || !user || guardLocked() || !validRange(newFrom, newTo, false)) return;
    setLeaveBusy(true);
    try {
      const who = names[leaveFor] || "Member";
      await addDoc(collection(firestore, `groups/${groupId}/leaves`), {
        userId: leaveFor,
        userName: who,
        startDate: Timestamp.fromDate(fromInput(newFrom)),
        endDate: Timestamp.fromDate(addDays(fromInput(newTo), 1)),
        addedByAdmin: true,
        createdAt: serverTimestamp(),
      });
      await logActivity("admin_leave", `added leave for ${who}: ${format(fromInput(newFrom), "MMM d")} – ${format(fromInput(newTo), "MMM d, yyyy")}`, { targetUserId: leaveFor });
      setNewFrom("");
      setNewTo("");
      toast({ title: "Leave added" });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Could not add leave", description: "Check that the new Firestore Rules are published." });
    } finally {
      setLeaveBusy(false);
    }
  };

  const saveLeave = async (l: LeaveDoc) => {
    if (!l.id || !leaveFor || guardLocked()) return;
    const draft = drafts[l.id];
    if (!draft || !validRange(draft.from, draft.to, true)) return;
    setLeaveBusy(true);
    try {
      const who = names[leaveFor] || "Member";
      const before = leaveLabel(l);
      await updateDoc(doc(firestore, `groups/${groupId}/leaves`, l.id), {
        startDate: Timestamp.fromDate(fromInput(draft.from)),
        endDate: draft.to ? Timestamp.fromDate(addDays(fromInput(draft.to), 1)) : null,
        updatedAt: serverTimestamp(),
      });
      const after = `${format(fromInput(draft.from), "MMM d")} – ${draft.to ? format(fromInput(draft.to), "MMM d") : "ongoing"}`;
      await logActivity("admin_leave", `changed ${who}'s leave: ${before} → ${after}`, { targetUserId: leaveFor });
      toast({ title: "Leave updated" });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Could not update leave", description: "Check that the new Firestore Rules are published." });
    } finally {
      setLeaveBusy(false);
    }
  };

  const removeLeave = async (l: LeaveDoc) => {
    if (!l.id || !leaveFor || guardLocked()) return;
    setLeaveBusy(true);
    try {
      await deleteDoc(doc(firestore, `groups/${groupId}/leaves`, l.id));
      await logActivity("admin_leave", `removed ${names[leaveFor] || "Member"}'s leave (${leaveLabel(l)})`, { targetUserId: leaveFor });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Could not remove leave" });
    } finally {
      setLeaveBusy(false);
    }
  };

  /* ================= settings ================= */
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftLeaveCats, setDraftLeaveCats] = useState<string[]>([]);
  const [draftSplit, setDraftSplit] = useState<Record<string, string[] | null>>({});
  const [settingsBusy, setSettingsBusy] = useState(false);

  const openSettings = () => {
    setDraftLeaveCats([...leaveCategories]);
    setDraftSplit(Object.fromEntries(BILL_TYPES.map((b) => [b, splitMembers[b] ?? null])));
    setSettingsOpen(true);
  };

  const toggleIn = (list: string[], item: string) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  const saveSettings = async () => {
    if (!user) return;
    const cleanSplit: Record<string, string[] | null> = {};
    for (const b of BILL_TYPES) {
      const chosen = draftSplit[b];
      if (chosen && chosen.length === 0) {
        toast({ variant: "destructive", title: `Choose at least one member for ${BILL_LABEL[b]}` });
        return;
      }
      cleanSplit[b] = chosen && (b === "Other" || chosen.length < members.length) ? chosen : null;
    }
    if (locked) {
      toast({ variant: "destructive", title: "This month is locked", description: "Unlock it to change who shares the bills." });
      return;
    }
    setSettingsBusy(true);
    try {
      await setDoc(sheetSettingsRef, { leaveCategories: draftLeaveCats, updatedBy: user.uid, updatedAt: serverTimestamp() });
      await setDoc(monthSettingsRef, { splitMembers: cleanSplit, updatedBy: user.uid, updatedAt: serverTimestamp() }, { merge: true });

      const splitText = BILL_TYPES.map((b) =>
        `${BILL_LABEL[b]}: ${cleanSplit[b] ? cleanSplit[b]!.map((id) => names[id] || "Member").join(", ") : b === "Other" ? "own" : "All"}`
      ).join("; ");
      await logActivity(
        "admin_settings",
        `updated sheet settings for ${format(month, "MMMM yyyy")}. Leave discount: ${draftLeaveCats.length ? draftLeaveCats.join(", ") : "none"}. ${splitText}`
      );
      toast({ title: "Settings saved" });
      setSettingsOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Could not save settings", description: "Check that the new Firestore Rules are published." });
    } finally {
      setSettingsBusy(false);
    }
  };

  /* ================= lock ================= */
  const [lockBusy, setLockBusy] = useState(false);
  const toggleLock = async () => {
    if (!user) return;
    const next = !locked;
    if (next && !window.confirm(`Lock ${format(month, "MMMM yyyy")}? No changes can be made in the sheet until it is unlocked.`)) return;
    setLockBusy(true);
    try {
      await setDoc(monthSettingsRef, { locked: next, updatedBy: user.uid, updatedAt: serverTimestamp() }, { merge: true });
      await logActivity("admin_lock", `${next ? "locked" : "unlocked"} ${format(month, "MMMM yyyy")}`);
      toast({ title: next ? "Month locked" : "Month unlocked" });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Could not change lock" });
    } finally {
      setLockBusy(false);
    }
  };

  /* ================= render ================= */
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

  const cell = "border-b border-r border-border/60";
  const sticky = "sticky left-0 z-10 bg-card";
  const head = "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";

  const EditCell = ({ userId, field }: { userId: string; field: AdjustField }) => {
    const r = result.byMember[userId];
    const v = r?.[field] ?? 0;
    const change = r?.adjustments[field] ?? 0;
    return (
      <td className={`${cell} p-0`}>
        <button
          type="button"
          onClick={() => openEdit(userId, field)}
          disabled={locked}
          title={change ? `Admin change: ${change > 0 ? "+" : ""}${num(change)}` : locked ? "Month is locked" : "Click to edit"}
          className="relative flex h-full min-h-[56px] w-full items-center justify-end px-4 text-base tabular-nums transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          {fmtField(field, v)}
          {change !== 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />}
        </button>
      </td>
    );
  };

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Table2 className="h-5 w-5" />
              Monthly Sheet
              {locked && (
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3 w-3" /> Locked
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Bazar and ETC show what each member added. Utilities and Wi-Fi show each member's share. Click a number to edit; every change goes to Activity Log.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="icon" onClick={() => setMonth((m) => subMonths(m, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[8.5rem] text-center font-semibold">{format(month, "MMMM yyyy")}</span>
            <Button type="button" variant="outline" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" className="gap-2" onClick={openSettings}>
              <Settings2 className="h-4 w-4" /> Settings
            </Button>
            <Button type="button" variant={locked ? "default" : "outline"} className="gap-2" onClick={() => void toggleLock()} disabled={lockBusy}>
              {lockBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : locked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {locked ? "Unlock" : "Lock month"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No members in this month.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className={`${head} ${sticky} ${cell} text-left`}>Name</th>
                    {(["meals", "bazar", "utilities", "wifi", "etc"] as AdjustField[]).map((f) => (
                      <th key={f} className={`${head} ${cell} text-right`}>{FIELD_LABEL[f]}</th>
                    ))}
                    <th className={`${head} ${cell} text-right`}>Total</th>
                    <th className={`${head} border-b border-border/60 text-left`}>Leave</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const r = result.byMember[m.id];
                    const away = daysAwayInMonth(m.id);
                    const count = leavesOf(m.id).length;
                    return (
                      <tr key={m.id}>
                        <td className={`${sticky} ${cell} whitespace-nowrap px-4 text-base font-medium`}>{names[m.id] || "…"}</td>
                        <EditCell userId={m.id} field="meals" />
                        <EditCell userId={m.id} field="bazar" />
                        <EditCell userId={m.id} field="utilities" />
                        <EditCell userId={m.id} field="wifi" />
                        <EditCell userId={m.id} field="etc" />
                        <td className={`${cell} px-4 text-right text-base font-bold tabular-nums`}>{money(r?.total ?? 0)}</td>
                        <td className="border-b border-border/60 p-0">
                          <button
                            type="button"
                            onClick={() => openLeave(m.id)}
                            className="flex h-full min-h-[56px] w-full items-center gap-2 px-4 text-left transition-colors hover:bg-primary/10"
                          >
                            <CalendarOff className="h-4 w-4 shrink-0 text-muted-foreground" />
                            {away > 0 ? (
                              <span>
                                <span className="font-semibold">{away} {away === 1 ? "day" : "days"}</span>
                                <span className="text-muted-foreground"> this month</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">{count > 0 ? `${count} leave${count > 1 ? "s" : ""}` : "No leave"}</span>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-muted/40 font-semibold">
                  <tr>
                    <td className={`${sticky} border-r border-border/60 px-4 py-4`}>Total</td>
                    <td className="border-r border-border/60 px-4 py-4 text-right tabular-nums">{num(totals.meals)}</td>
                    <td className="border-r border-border/60 px-4 py-4 text-right tabular-nums">{money(totals.bazar)}</td>
                    <td className="border-r border-border/60 px-4 py-4 text-right tabular-nums">{money(totals.utilities)}</td>
                    <td className="border-r border-border/60 px-4 py-4 text-right tabular-nums">{money(totals.wifi)}</td>
                    <td className="border-r border-border/60 px-4 py-4 text-right tabular-nums">{money(totals.etc)}</td>
                    <td className="border-r border-border/60 px-4 py-4 text-right tabular-nums">{money(totals.total)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>Meal rate: {money(result.mealRate)}</span>
              <span>Leave discount on: {leaveCategories.length ? leaveCategories.join(", ") : "none"}</span>
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
            <DialogTitle>{edit ? `${names[edit.userId] || "Member"} · ${FIELD_LABEL[edit.field]}` : ""}</DialogTitle>
            <DialogDescription>Current: {edit ? fmtField(edit.field, currentValue) : ""}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={mode === "change" ? "default" : "outline"} onClick={() => setMode("change")}>
                Add / Subtract
              </Button>
              <Button type="button" variant={mode === "set" ? "default" : "outline"} onClick={() => setMode("set")}>
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
                className="h-12 text-lg"
                autoFocus
              />
              {delta !== 0 && edit && (
                <p className="text-sm">
                  New value: <span className="font-semibold">{fmtField(edit.field, newValue)}</span>{" "}
                  <span className={delta > 0 ? "text-emerald-500" : "text-red-500"}>
                    ({delta > 0 ? "+" : "−"}
                    {fmtField(edit.field, Math.abs(delta))})
                  </span>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="adj-reason">Reason (optional)</Label>
              <Textarea id="adj-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="Example: Forgot to turn off meal" />
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarOff className="h-5 w-5" />
              Leave · {leaveFor ? names[leaveFor] || "Member" : ""}
            </DialogTitle>
            <DialogDescription>
              All leave for this member, including leave they turned on themselves. Change the dates and press Save.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {leaveFor && leavesOf(leaveFor).length === 0 && <p className="text-sm text-muted-foreground">No leave recorded.</p>}
            {leaveFor &&
              leavesOf(leaveFor).map((l) => {
                const draft = drafts[l.id!] ?? { from: "", to: "" };
                return (
                  <div key={l.id} className="space-y-3 rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{leaveLabel(l)}</span>
                      <Badge variant="outline">{l.addedByAdmin ? "Added by admin" : "Added by member"}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>From</Label>
                        <Input type="date" value={draft.from} onChange={(e) => setDrafts((d) => ({ ...d, [l.id!]: { ...draft, from: e.target.value } }))} />
                      </div>
                      <div className="space-y-1">
                        <Label>To {draft.to ? "" : "(ongoing)"}</Label>
                        <Input type="date" value={draft.to} onChange={(e) => setDrafts((d) => ({ ...d, [l.id!]: { ...draft, to: e.target.value } }))} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" size="sm" variant="ghost" className="text-destructive" disabled={leaveBusy || locked} onClick={() => void removeLeave(l)}>
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                      <Button type="button" size="sm" disabled={leaveBusy || locked} onClick={() => void saveLeave(l)}>
                        Save
                      </Button>
                    </div>
                  </div>
                );
              })}

            <div className="space-y-3 rounded-lg border border-dashed p-3">
              <p className="font-medium">Add new leave</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="new-from">From (first day away)</Label>
                  <Input id="new-from" type="date" value={newFrom} onChange={(e) => setNewFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-to">To (last day away)</Label>
                  <Input id="new-to" type="date" value={newTo} onChange={(e) => setNewTo(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" size="sm" onClick={() => void addLeave()} disabled={leaveBusy || locked}>
                  {leaveBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Add leave
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLeaveFor(null)} disabled={leaveBusy}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- settings dialog ---------- */}
      <Dialog open={settingsOpen} onOpenChange={(o) => !o && !settingsBusy && setSettingsOpen(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" /> Sheet Settings
            </DialogTitle>
            <DialogDescription>Leave discount applies to every month. Bill sharing is for {format(month, "MMMM yyyy")} only.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-3">
              <div>
                <p className="font-semibold">Leave Discount</p>
                <p className="text-sm text-muted-foreground">Members on leave pay less for these bills (by the days they were at home).</p>
              </div>
              <div className="flex flex-wrap gap-4">
                {LEAVE_BILL_TYPES.map((b) => (
                  <label key={b} className="flex cursor-pointer items-center gap-2">
                    <Checkbox checked={draftLeaveCats.includes(b)} onCheckedChange={() => setDraftLeaveCats((l) => toggleIn(l, b))} />
                    {b}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="font-semibold">Who shares each bill</p>
                <p className="text-sm text-muted-foreground">Bills default to All. ETC stays with the person who added it, unless you choose members to share it.</p>
              </div>
              {BILL_TYPES.map((b) => {
                const chosen = draftSplit[b];
                const isAll = !chosen;
                return (
                  <div key={b} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{BILL_LABEL[b]}</span>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={isAll}
                          onCheckedChange={(v) => setDraftSplit((s) => ({ ...s, [b]: v ? null : members.map((m) => m.id) }))}
                        />
                        {b === "Other" ? "Only the person who added it" : "All"}
                      </label>
                    </div>
                    {!isAll && (
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {members.map((m) => (
                          <label key={m.id} className="flex cursor-pointer items-center gap-2 text-sm">
                            <Checkbox
                              checked={chosen!.includes(m.id)}
                              onCheckedChange={() => setDraftSplit((s) => ({ ...s, [b]: toggleIn(s[b] ?? [], m.id) }))}
                            />
                            {names[m.id] || "Member"}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSettingsOpen(false)} disabled={settingsBusy}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveSettings()} disabled={settingsBusy}>
              {settingsBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
