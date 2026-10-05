/*
 * One shared month calculation used by the Admin sheet, Monthly Summary
 * and Settlement History, so every page uses the same numbers.
 *
 * Sheet columns:
 * - Bazar     = Food & Groceries the member added (+ admin change)
 * - Utilities = member's share of Electricity + Gas (+ admin change)
 * - Wi-Fi     = member's share of Wi-Fi (+ admin change)
 * - ETC       = extra ("Other") costs the member added (+ admin change).
 *               Stays with that member unless the admin chooses members
 *               to share ETC for the month.
 * - Total     = Bazar + Utilities + Wi-Fi + ETC
 *
 * Settlement (who owes whom):
 * - meal rate = all Bazar / all meals; meal cost = meal rate x meals
 * - share     = meal cost + Utilities + Wi-Fi + ETC
 * - paid      = everything the member added (+ admin Bazar change)
 */
import type { Expense, MealLog } from "./types";
import { isMemberHomeOnDay, type LeaveRecord, type MemberPresenceInfo } from "./electricity-split";

export type AdjustField = "meals" | "bazar" | "utilities" | "wifi" | "etc";
export const ADJUST_FIELDS: AdjustField[] = ["meals", "bazar", "utilities", "wifi", "etc"];

/* Bill types that can be split / get the leave rule. "Other" = ETC column. */
export const BILL_TYPES = ["Electricity", "Gas", "Wi-Fi", "Other"] as const;
export type BillType = (typeof BILL_TYPES)[number];
export const LEAVE_BILL_TYPES = ["Electricity", "Gas", "Wi-Fi"] as const;

export interface MonthAdjustment {
  id?: string;
  userId: string;
  monthKey: string;
  field: AdjustField;
  delta: number;
  reason?: string;
  createdByName?: string;
  createdAt?: unknown;
}

/* groups/{groupId}/sheetSettings/default */
export interface SheetSettings {
  leaveCategories?: string[];
}

/* groups/{groupId}/monthSettings/{monthKey} */
export interface MonthSettings {
  locked?: boolean;
  /* null / missing = All members */
  splitMembers?: Partial<Record<BillType, string[] | null>>;
}

export interface MemberMonthResult {
  mealsLogged: number;
  meals: number;
  bazar: number;
  utilities: number;
  wifi: number;
  etc: number;
  total: number;
  mealCost: number;
  settlementShare: number;
  paidAdjustment: number;
  daysHome: number;
  adjustments: Record<AdjustField, number>;
}

export interface MonthResult {
  byMember: Record<string, MemberMonthResult>;
  mealRate: number;
  totalMeals: number;
  foodTotal: number;
  adjustmentMoneyNet: number;
}

export const DEFAULT_LEAVE_CATEGORIES = ["Electricity"];

export const monthKeyOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const dayStart = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const NOT_ETC = ["Food & Groceries", "Electricity", "Gas", "Wi-Fi"];

export function computeMonth(params: {
  members: MemberPresenceInfo[];
  meals: MealLog[];
  expenses: Expense[];
  leaves?: LeaveRecord[];
  adjustments?: MonthAdjustment[];
  monthStart: Date;
  monthEnd: Date;
  leaveCategories?: string[];
  splitMembers?: MonthSettings["splitMembers"];
}): MonthResult {
  const {
    members,
    meals,
    expenses,
    leaves = [],
    adjustments = [],
    monthStart,
    monthEnd,
    leaveCategories = DEFAULT_LEAVE_CATEGORIES,
    splitMembers = {},
  } = params;

  const ids = members.map((m) => m.id);
  const zero = () => Object.fromEntries(ids.map((id) => [id, 0])) as Record<string, number>;

  /* ---- admin changes ---- */
  const adj: Record<string, Record<AdjustField, number>> = {};
  ids.forEach((id) => {
    adj[id] = { meals: 0, bazar: 0, utilities: 0, wifi: 0, etc: 0 };
  });
  let adjustmentMoneyNet = 0;
  adjustments.forEach((a) => {
    if (!adj[a.userId] || !ADJUST_FIELDS.includes(a.field)) return;
    const delta = Number(a.delta) || 0;
    adj[a.userId][a.field] += delta;
    if (a.field !== "meals") adjustmentMoneyNet += delta;
  });

  /* ---- days at home ---- */
  const leavesByUser = leaves.reduce((acc, l) => {
    (acc[l.userId] = acc[l.userId] || []).push(l);
    return acc;
  }, {} as Record<string, LeaveRecord[]>);

  const daysHome = zero();
  const last = dayStart(monthEnd);
  for (let d = dayStart(monthStart); d <= last; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    members.forEach((m) => {
      if (isMemberHomeOnDay(m, leavesByUser[m.id] || [], d)) daysHome[m.id] += 1;
    });
  }

  /* ---- split one bill type among its chosen members ---- */
  const sumOf = (filter: (category: string) => boolean) =>
    expenses.filter((e) => filter(e.category)).reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const split = (billType: BillType, total: number) => {
    const out = zero();
    if (!total) return out;
    const chosen = splitMembers?.[billType];
    if (billType === "Other" && !(Array.isArray(chosen) && chosen.length > 0)) return out;
    let sharers = Array.isArray(chosen) && chosen.length > 0 ? ids.filter((id) => chosen.includes(id)) : ids;
    if (sharers.length === 0) sharers = ids;
    if (sharers.length === 0) return out;

    const useLeave = billType !== "Other" && leaveCategories.includes(billType);
    const totalDays = sharers.reduce((s, id) => s + daysHome[id], 0);
    sharers.forEach((id) => {
      out[id] = useLeave && totalDays > 0 ? (total * daysHome[id]) / totalDays : total / sharers.length;
    });
    return out;
  };

  const elec = split("Electricity", sumOf((c) => c === "Electricity"));
  const gas = split("Gas", sumOf((c) => c === "Gas"));
  const wifiShares = split("Wi-Fi", sumOf((c) => c === "Wi-Fi"));
  /* what each member added themselves */
  const ownSum = (filter: (category: string) => boolean) => {
    const out = zero();
    expenses.forEach((e) => {
      if (out[e.userId] !== undefined && filter(e.category)) out[e.userId] += Number(e.amount) || 0;
    });
    return out;
  };
  const ownFood = ownSum((c) => c === "Food & Groceries");
  const ownEtc = ownSum((c) => !NOT_ETC.includes(c));
  const etcSplitOn = Array.isArray(splitMembers?.Other) && splitMembers!.Other!.length > 0;
  const etcShares = etcSplitOn ? split("Other", sumOf((c) => !NOT_ETC.includes(c))) : ownEtc;

  /* ---- meals & bazar ---- */
  const logged = zero();
  meals.forEach((meal) => {
    if (logged[meal.userId] === undefined) return;
    logged[meal.userId] += Number(meal.mealNumber ?? 1) || 0;
  });
  const mealCount = zero();
  ids.forEach((id) => (mealCount[id] = Math.max(0, logged[id] + adj[id].meals)));
  const totalMeals = ids.reduce((s, id) => s + mealCount[id], 0);
  const bazarOf = (id: string) => ownFood[id] + adj[id].bazar;
  const foodTotal = ids.reduce((s, id) => s + bazarOf(id), 0);
  const mealRate = totalMeals > 0 ? foodTotal / totalMeals : 0;

  const byMember: Record<string, MemberMonthResult> = {};
  ids.forEach((id) => {
    const bazar = bazarOf(id);
    const mealCost = mealRate * mealCount[id];
    const utilities = elec[id] + gas[id] + adj[id].utilities;
    const wifi = wifiShares[id] + adj[id].wifi;
    const etc = etcShares[id] + adj[id].etc;
    byMember[id] = {
      mealsLogged: logged[id],
      meals: mealCount[id],
      bazar,
      utilities,
      wifi,
      etc,
      total: bazar + utilities + wifi + etc,
      mealCost,
      settlementShare: mealCost + utilities + wifi + etc,
      paidAdjustment: adj[id].bazar,
      daysHome: daysHome[id],
      adjustments: adj[id],
    };
  });

  return { byMember, mealRate, totalMeals, foodTotal, adjustmentMoneyNet };
}
