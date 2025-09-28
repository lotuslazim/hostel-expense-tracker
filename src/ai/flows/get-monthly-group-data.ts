
'use server';

/**
 * @fileOverview A flow to fetch and process monthly group data for reports.
 *
 * - getMonthlyGroupData - Fetches all necessary data for a group for a given month.
 * - GetMonthlyGroupDataInput - The input type for the getMonthlyGroupData function.
 * - MonthlyGroupData - The return type for the getMonthlyGroupData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { startOfMonth, endOfMonth, getYear, parseISO } from 'date-fns';
import { MonthlyGroupData, MonthlyGroupDataSchema } from '../schemas';

if (!getApps().length) {
  initializeApp();
}
const firestore = getFirestore();

const GetMonthlyGroupDataInputSchema = z.object({
  groupId: z.string(),
  date: z.string().describe('The date for which to fetch the data (ISO string format).'),
});

export type GetMonthlyGroupDataInput = z.infer<typeof GetMonthlyGroupDataInputSchema>;


const getMonthlyGroupDataFlow = ai.defineFlow(
  {
    name: 'getMonthlyGroupDataFlow',
    inputSchema: GetMonthlyGroupDataInputSchema,
    outputSchema: MonthlyGroupDataSchema,
  },
  async ({ groupId, date }) => {
    const targetDate = parseISO(date);
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);
    const monthName = `${targetDate.toLocaleString('default', { month: 'long' })} ${getYear(targetDate)}`;

    // 1. Get all members of the group
    const membersQuery = firestore.collection(`groups/${groupId}/members`);
    const membersSnapshot = await membersQuery.get();
    const members = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (members.length === 0) {
      return { month: monthName, members: [] };
    }

    // 2. Fetch meals and expenses for the month
    const mealsQuery = firestore.collection(`groups/${groupId}/meals`)
      .where('date', '>=', monthStart)
      .where('date', '<=', monthEnd);
    const mealsSnapshot = await mealsQuery.get();
      
    const expensesQuery = firestore.collection(`groups/${groupId}/expenses`)
      .where('date', '>=', monthStart)
      .where('date', '<=', monthEnd);
    const expensesSnapshot = await expensesQuery.get();

    const meals = mealsSnapshot.docs.map(doc => doc.data());
    const expenses = expensesSnapshot.docs.map(doc => doc.data());

    // 3. Process data for each member
    const membersData = members.map(user => {
      const memberMeals = meals.filter(m => m.userId === user.id);
      const memberExpenses = expenses.filter(e => e.userId === user.id);
      
      const totalMeals = memberMeals.reduce((sum, meal) => sum + (meal.mealNumber || 1), 0);

      const foodExpenses = memberExpenses
        .filter(e => e.category === 'Food')
        .reduce((sum, e) => sum + e.amount, 0);
      
      const electricityExpenses = memberExpenses
        .filter(e => e.category === 'Electricity')
        .reduce((sum, e) => sum + e.amount, 0);

      const gasExpenses = memberExpenses
        .filter(e => e.category === 'Gas')
        .reduce((sum, e) => sum + e.amount, 0);
        
      return {
        id: user.id,
        name: user.displayName || user.email.split('@')[0],
        meals: totalMeals,
        expenses: {
          food: foodExpenses,
          electricity: electricityExpenses,
          gas: gasExpenses,
        }
      };
    });

    return {
      month: monthName,
      members: membersData
    };
  }
);


export async function getMonthlyGroupData(
  input: GetMonthlyGroupDataInput
): Promise<MonthlyGroupData> {
  return getMonthlyGroupDataFlow(input);
}
