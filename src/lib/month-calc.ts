/*
 * One shared month calculation used by the Admin table, Monthly Summary
 * and Settlement History, so every page shows the same numbers.
 *
 * Columns: Meals, Bazar, Utilities (Electricity + Gas), Wi-Fi, ETC, Total.
 *
 * - Bazar     = meal rate x member's meals
 *               (meal rate = Food & Groceries total / all meals)
 * - Bills     = split among members. For bill types where the leave rule
 *               is on, each member pays by the number of days they were
 *               at home this month; otherwise split equally.
 * - Admin adjustments (+/-) are added to that member's column only.
 *   They raise/lower the member's Total and the group's total; nobody
 *   else's share changes.
 */
import type { Expense, MealLog } from "./types";
import { isMemberHomeOnDay, type LeaveRecord, type MemberPresenceInfo } from "./electricity-split";

export type AdjustField = "meals" | "utilities" | "wifi" | "etc";

export const ADJUST_FIELDS: AdjustField[] = ["meals", "utilities", "wifi", "etc"];

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

export interface MemberMonthResult {
  mealsLogged: number;
  meals: number;
  bazar: number;
  utilities: number;
  wifi: number;
  etc: number;
  total: number;
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

/* Bill types where the leave rule applies (Phase 2 makes this a setting). */
export const DEFAULT_LEAVE_CATEGORIES = ["Electricity"];

export const monthKeyOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const dayStart = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const UTILITY = ["Electricity", "Gas"];
const WIFI = ["Wi-Fi"];
const NOT_ETC = ["Food & Groceries", ...UTILITY, ...WIFI];

export function computeMonth(params: {
  members: MemberPresenceInfo[];
  meals: MealLog[];
  expenses: Expense[];
  leaves?: LeaveRecord[];
  adjustments?: MonthAdjustment[];
  monthStart: Date;
  monthEnd: Date;
  leaveCategories?: string[];
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
  } = params;

  const ids = members.map((m) => m.id);
  const count = ids.length || 1;

  /* ---- adjustments per member ---- */
  const adj: Record<string, Record<AdjustField, number>> = {};
  ids.forEach((id) => {
    adj[id] = { meals: 0, utilities: 0, wifi: 0, etc: 0 };
  });
  let adjustmentMoneyNet = 0;
  adjustments.forEach((a) => {
    if (!adj[a.userId] || !ADJUST_FIELDS.includes(a.field)) return;
    const delta = Number(a.delta) || 0;
    adj[a.userId][a.field] += delta;
    if (a.field !== "meals") adjustmentMoneyNet += delta;
  });

  /* ---- days at home this month ---- */
  const leavesByUser = leaves.reduce((acc, l) => {
    (acc[l.userId] = acc[l.userId] || []).push(l);
    return acc;
  }, {} as Record<string, LeaveRecord[]>);

  const daysHome: Record<string, number> = {};
  ids.forEach((id) => (daysHome[id] = 0));
  const last = dayStart(monthEnd);
  for (let d = dayStart(monthStart); d <= last; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    members.forEach((m) => {
      if (isMemberHomeOnDay(m, leavesByUser[m.id] || [], d)) daysHome[m.id] += 1;
    });
  }
  const totalDaysHome = ids.reduce((s, id) => s + daysHome[id], 0);

  /* ---- split a bill total among members ---- */
  const split = (total: number, useLeave: boolean) => {
    const out: Record<string, number> = {};
    ids.forEach((id) => {
      out[id] =
        useLeave && totalDaysHome > 0
          ? (total * daysHome[id]) / totalDaysHome
          : total / count;
    });
    return out;
  };

  const sumOf = (cats: string[] | null, exclude?: string[]) =>
    expenses
      .filter((e) => (cats ? cats.includes(e.category) : !exclude!.includes(e.category)))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const utilShares: Record<string, number> = {};
  ids.forEach((id) => (utilShares[id] = 0));
  UTILITY.forEach((cat) => {
    const part = split(sumOf([cat]), leaveCategories.includes(cat));
    ids.forEach((id) => (utilShares[id] += part[id]));
  });
  const wifiShares = split(sumOf(WIFI), leaveCategories.includes("Wi-Fi"));
  const etcShares = split(sumOf(null, NOT_ETC), false);

  /* ---- meals & bazar ---- */
  const logged: Record<string, number> = {};
  ids.forEach((id) => (logged[id] = 0));
  meals.forEach((meal) => {
    if (logged[meal.userId] === undefined) return;
    logged[meal.userId] += Number(meal.mealNumber ?? 1) || 0;
  });

  const mealCount: Record<string, number> = {};
  ids.forEach((id) => (mealCount[id] = Math.max(0, logged[id] + adj[id].meals)));
  const totalMeals = ids.reduce((s, id) => s + mealCount[id], 0);
  const foodTotal = sumOf(["Food & Groceries"]);
  const mealRate = totalMeals > 0 ? foodTotal / totalMeals : 0;

  const byMember: Record<string, MemberMonthResult> = {};
  ids.forEach((id) => {
    const bazar = mealRate * mealCount[id];
    const utilities = utilShares[id] + adj[id].utilities;
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
      daysHome: daysHome[id],
      adjustments: adj[id],
    };
  });

  return { byMember, mealRate, totalMeals, foodTotal, adjustmentMoneyNet };
}
