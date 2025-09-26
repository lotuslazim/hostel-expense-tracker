'use server';

/**
 * @fileOverview A flow to fetch daily meal and expense data for a single member.
 *
 * - getMemberDailyData - Fetches and processes daily data for a member.
 * - GetMemberDailyDataInput - The input type for the getMemberDailyData function.
 * - MemberDailyData - The return type for the getMemberDailyData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO } from 'date-fns';
import { MemberDailyData, MemberDailyDataSchema } from '../schemas';

const GetMemberDailyDataInputSchema = z.object({
  groupId: z.string(),
  memberId: z.string(),
  date: z.string().describe('The date for which to fetch the data (ISO string format).'),
});

export type GetMemberDailyDataInput = z.infer<
  typeof GetMemberDailyDataInputSchema
>;

async function getDocsData(q: any) {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

const getMemberDailyDataFlow = ai.defineFlow(
  {
    name: 'getMemberDailyDataFlow',
    inputSchema: GetMemberDailyDataInputSchema,
    outputSchema: MemberDailyDataSchema,
  },
  async ({ groupId, memberId, date }) => {
    const { firestore } = initializeFirebase();
    const targetDate = new Date(date);
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Fetch all meals and expenses for the member for the whole month
    const mealsQuery = query(
      collection(firestore, `groups/${groupId}/meals`),
      where('userId', '==', memberId),
      where('date', '>=', monthStart),
      where('date', '<=', monthEnd)
    );
    const expensesQuery = query(
      collection(firestore, `groups/${groupId}/expenses`),
      where('userId', '==', memberId),
      where('date', '>=', monthStart),
      where('date', '<=', monthEnd)
    );

    const [meals, expenses] = await Promise.all([
        getDocsData(mealsQuery),
        getDocsData(expensesQuery),
    ]);

    // Process data for each day of the month
    const dailyData = daysInMonth.map(day => {
        const dayString = format(day, 'yyyy-MM-dd');
        
        const mealsOnDay = meals.filter(m => format(m.date.toDate(), 'yyyy-MM-dd') === dayString).length;
        
        const foodExpensesOnDay = expenses
            .filter(e => e.category === 'Food' && format(e.date.toDate(), 'yyyy-MM-dd') === dayString)
            .reduce((sum, e) => sum + e.amount, 0);

        const electricityExpensesOnDay = expenses
            .filter(e => e.category === 'Electricity' && format(e.date.toDate(), 'yyyy-MM-dd') === dayString)
            .reduce((sum, e) => sum + e.amount, 0);

        const gasExpensesOnDay = expenses
            .filter(e => e.category === 'Gas' && format(e.date.toDate(), 'yyyy-MM-dd') === dayString)
            .reduce((sum, e) => sum + e.amount, 0);

        return {
            date: dayString,
            meals: mealsOnDay,
            expenses: {
                food: foodExpensesOnDay,
                electricity: electricityExpensesOnDay,
                gas: gasExpensesOnDay,
            },
        };
    });

    return { dailyData };
  }
);


export async function getMemberDailyData(
  input: GetMemberDailyDataInput
): Promise<MemberDailyData> {
  return getMemberDailyDataFlow(input);
}
