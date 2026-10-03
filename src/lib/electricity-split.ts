/*
 * Electricity bill split by "person-days" (per recharge).
 *
 * - Each Electricity expense (recharge) covers from its date until the day
 *   before the next recharge, or until the end of the month for the last one.
 * - A member pays for that recharge in proportion to how many days of that
 *   period they were at home.
 * - Leave rule: the leaving day counts as AWAY, the return day counts as HOME.
 * - If nobody was home for a period, the bill is split equally.
 */
import type { Expense } from "./types";

export interface LeaveRecord {
  id?: string;
  userId: string;
  userName?: string;
  startDate: unknown;
  endDate?: unknown;
}

export interface MemberPresenceInfo {
  id: string;
  joinedAt?: unknown;
  leftAt?: unknown;
}

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const dayStart = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const nextDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

const prevDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);

export function isMemberHomeOnDay(
  member: MemberPresenceInfo,
  memberLeaves: LeaveRecord[],
  day: Date
): boolean {
  const joined = toDate(member.joinedAt);
  if (joined && dayStart(joined) > day) return false;

  const left = toDate(member.leftAt);
  if (left && dayStart(left) <= day) return false;

  for (const leave of memberLeaves) {
    const start = toDate(leave.startDate);
    if (!start) continue;
    const end = toDate(leave.endDate);
    const awayFrom = dayStart(start);
    const backOn = end ? dayStart(end) : null;

    if (day >= awayFrom && (!backOn || day < backOn)) {
      return false;
    }
  }

  return true;
}

export function computeElectricityShares(
  expenses: Expense[],
  members: MemberPresenceInfo[],
  leaves: LeaveRecord[],
  monthEnd: unknown
): Record<string, number> {
  const shares: Record<string, number> = {};
  members.forEach((member) => {
    shares[member.id] = 0;
  });

  if (members.length === 0) return shares;

  const lastDay = dayStart(toDate(monthEnd) ?? new Date());

  const leavesByUser = leaves.reduce((acc, leave) => {
    (acc[leave.userId] = acc[leave.userId] || []).push(leave);
    return acc;
  }, {} as Record<string, LeaveRecord[]>);

  const bills = expenses
    .filter((expense) => expense.category === "Electricity" && (expense.amount || 0) > 0)
    .map((expense) => ({
      amount: expense.amount,
      date: dayStart(toDate(expense.date) ?? new Date()),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  bills.forEach((bill, index) => {
    const next = bills[index + 1]?.date;
    let periodEnd = next ? prevDay(next) : lastDay;
    if (periodEnd < bill.date) periodEnd = bill.date;

    const homeDays: Record<string, number> = {};
    let totalHomeDays = 0;

    for (let day = bill.date; day <= periodEnd; day = nextDay(day)) {
      members.forEach((member) => {
        if (isMemberHomeOnDay(member, leavesByUser[member.id] || [], day)) {
          homeDays[member.id] = (homeDays[member.id] || 0) + 1;
          totalHomeDays += 1;
        }
      });
    }

    members.forEach((member) => {
      shares[member.id] +=
        totalHomeDays > 0
          ? (bill.amount * (homeDays[member.id] || 0)) / totalHomeDays
          : bill.amount / members.length;
    });
  });

  return shares;
}
