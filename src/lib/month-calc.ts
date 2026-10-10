/*
 * Shared month calculation for the Admin sheet, Monthly Summary and
 * Settlement History.
 *
 * ADMIN SHEET = what each member entered (no splitting):
 *   Meals     = meals the member logged (+ admin change)
 *   Bazar     = Food & Groceries the member entered (+ admin change)
 *   Utilities = Electricity + Gas the member entered (+ admin change)
 *   Wi-Fi     = Wi-Fi the member entered (+ admin change)
 *   ETC       = any other cost the member entered (+ admin change)
 *   Total     = Bazar + Utilities + Wi-Fi + ETC
 *
 * SETTLEMENT = who owes whom (splitting happens only here):
 *   meal rate   = all Bazar / all meals, meal cost = meal rate x meals
 *   bills       = Electricity / Gas / Wi-Fi totals split among the chosen
 *                 members (default all), by days at home if the leave
 *                 discount is on for that bill
 *   ETC         = stays with the person who entered it, unless the admin
 *                 chooses members to share ETC for that month
 *   share       = meal cost + bill shares + ETC share
 *   paid        = everything the member entered + admin changes
 */
import type { Expense, MealLog } from "./types";
import { isMemberHomeOnDay, type LeaveRecord, type MemberPresenceInfo } from "./electricity-split";

export type AdjustField = "meals" | "bazar" | "utilities" | "wifi" | "etc";
export const ADJUST_FIELDS: AdjustField[] = ["meals", "bazar", "utilities", "wifi", "etc"];
export type MoneyField = Exclude<AdjustField, "meals">;

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

export interface SheetSettings {
  leaveCategories?: string[];
}

export interface MonthSettings {
  locked?: boolean;
  splitMembers?: Partial<Record<BillType, string[] | null>>;
}

export interface MemberMonthResult {
  meals: number;
  bazar: number;
  utilities: number;
  wifi: number;
  etc: number;
  total: number;
  entryCount: Record<AdjustField, number>;
  adjustments: Record<AdjustField, number>;
  mealCost: number;
  settlementShare: number;
  paidAdjustment: number;
  daysHome: number;
}

export interface MonthResult {
  byMember: Record<string, MemberMonthResult>;
  mealRate: number;
  totalMeals: number;
  foodTotal: number;
}

export const DEFAULT_LEAVE_CATEGORIES = ["Electricity"];

/*
 * Fix: কিছু জায়গা থেকে Date-এর বদলে Firestore Timestamp আসত।
 * Timestamp-এ getFullYear() নেই, তাই Report পেজ crash করত
 * ("e.getFullYear is not a function")। এখন দুটোই চলবে।
 */
export const monthKeyOf = (input: Date | { toDate: () => Date }) => {
  const date = input instanceof Date ? input : input.toDate();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

/* Which sheet column an expense category belongs to. */
export const fieldOfCategory = (category: string): MoneyField => {
  if (category === "Food & Groceries") return "bazar";
  if (category === "Electricity" || category === "Gas") return "utilities";
  if (category === "Wi-Fi") return "wifi";
  return "etc";
};

const dayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

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
    leaveCategories = DEFAULT_LEAVE_CATEGORIES,
    splitMembers = {},
  } = params;

  // Fix: Timestamp এলেও Date-এ রূপান্তর, যাতে crash না করে।
  const asDate = (value: unknown): Date =>
    value instanceof Date ? value : (value as { toDate: () => Date }).toDate();
  const monthStart = asDate(params.monthStart);
  const monthEnd = asDate(params.monthEnd);

  const ids = members.map((m) => m.id);
  const zero = () => Object.fromEntries(ids.map((id) => [id, 0])) as Record<string, number>;
  const blank = (): Record<AdjustField, number> => ({ meals: 0, bazar: 0, utilities: 0, wifi: 0, etc: 0 });

  /* ---- admin changes ---- */
  const adj: Record<string, Record<AdjustField, number>> = {};
  ids.forEach((id) => (adj[id] = blank()));
  adjustments.forEach((a) => {
    if (!adj[a.userId] || !ADJUST_FIELDS.includes(a.field)) return;
    adj[a.userId][a.field] += Number(a.delta) || 0;
  });

  /* ---- what each member entered ---- */
  const entered: Record<string, Record<AdjustField, number>> = {};
  const count: Record<string, Record<AdjustField, number>> = {};
  const elecEntered = zero();
  const gasEntered = zero();
  ids.forEach((id) => {
    entered[id] = blank();
    count[id] = blank();
  });
  meals.forEach((meal) => {
    if (!entered[meal.userId]) return;
    entered[meal.userId].meals += Number(meal.mealNumber ?? 1) || 0;
    count[meal.userId].meals += 1;
  });
  expenses.forEach((e) => {
    if (!entered[e.userId]) return;
    const amount = Number(e.amount) || 0;
    const field = fieldOfCategory(e.category);
    entered[e.userId][field] += amount;
    count[e.userId][field] += 1;
    if (e.category === "Electricity") elecEntered[e.userId] += amount;
    if (e.category === "Gas") gasEntered[e.userId] += amount;
  });

  const col = (id: string, f: AdjustField) => entered[id][f] + adj[id][f];

  /* ---- days at home (for the leave discount) ---- */
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

  /* ---- settlement: split a bill total among its sharers ---- */
  const split = (billType: BillType, total: number) => {
    const out = zero();
    if (!total) return out;
    const chosen = splitMembers?.[billType];
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

  const sumIds = (fn: (id: string) => number) => ids.reduce((s, id) => s + fn(id), 0);
  /* admin Utilities changes count as Electricity */
  const elecShare = split("Electricity", sumIds((id) => elecEntered[id] + adj[id].utilities));
  const gasShare = split("Gas", sumIds((id) => gasEntered[id]));
  const wifiShare = split("Wi-Fi", sumIds((id) => col(id, "wifi")));
  const etcSplitOn = Array.isArray(splitMembers?.Other) && splitMembers!.Other!.length > 0;
  const etcShare = etcSplitOn
    ? split("Other", sumIds((id) => col(id, "etc")))
    : Object.fromEntries(ids.map((id) => [id, col(id, "etc")]));

  const mealCount = zero();
  ids.forEach((id) => (mealCount[id] = Math.max(0, col(id, "meals"))));
  const totalMeals = sumIds((id) => mealCount[id]);
  const foodTotal = sumIds((id) => col(id, "bazar"));
  const mealRate = totalMeals > 0 ? foodTotal / totalMeals : 0;

  const byMember: Record<string, MemberMonthResult> = {};
  ids.forEach((id) => {
    const bazar = col(id, "bazar");
    const utilities = col(id, "utilities");
    const wifi = col(id, "wifi");
    const etc = col(id, "etc");
    const mealCost = mealRate * mealCount[id];
    byMember[id] = {
      meals: mealCount[id],
      bazar,
      utilities,
      wifi,
      etc,
      total: bazar + utilities + wifi + etc,
      entryCount: count[id],
      adjustments: adj[id],
      mealCost,
      settlementShare: mealCost + elecShare[id] + gasShare[id] + wifiShare[id] + etcShare[id],
      paidAdjustment: adj[id].bazar + adj[id].utilities + adj[id].wifi + adj[id].etc,
      daysHome: daysHome[id],
    };
  });

  return { byMember, mealRate, totalMeals, foodTotal };
}
