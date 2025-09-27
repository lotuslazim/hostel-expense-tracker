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
import {
  collection,
  query,
  where,
  getDocs,
  DocumentData,
} from 'firebase/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { startOfMonth, endOfMonth, getYear } from 'date-fns';
import { MonthlyGroupData, MonthlyGroupDataSchema } from '../schemas';

if (!getApps().length) {
  initializeApp();
}
const firestore = getFirestore();

const GetMonthlyGroupDataInputSchema = z.object({
  groupId: z.string(),
  date: z.string().describe('The date for which to fetch the data (ISO string format).'),
});

export type GetMonthlyGroupDataInput = z.infer<
  typeof GetMonthlyGroupDataInputSchema
>;

async function getDocsData(q: any) {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}


const getMonthlyGroupDataFlow = ai.defineFlow(
  {
    name: 'getMonthlyGroupDataFlow',
    inputSchema: GetMonthlyGroupDataInputSchema,
    outputSchema: MonthlyGroupDataSchema,
  },
  async ({ groupId, date }) => {
    const targetDate = new Date(date);
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);
    const monthName = `${targetDate.toLocaleString('default', { month: 'long' })} ${getYear(targetDate)}`;

    // 1. Get all members of the group
    const usersQuery = query(collection(firestore, 'users'), where('groupId', '==', groupId));
    const users = await getDocsData(usersQuery);
    const memberIds = users.map(u => u.id);
    
    if (memberIds.length === 0) {
      return { month: monthName, members: [] };
    }

    // 2. Fetch meals and expenses for the month
    const mealsQuery = query(
      collection(firestore, `groups/${groupId}/meals`),
      where('date', '>=', monthStart),
      where('date', '<=', monthEnd)
    );
    const expensesQuery = query(
      collection(firestore, `groups/${groupId}/expenses`),
      where('date', '>=', monthStart),
      where('date', '<=', monthEnd)
    );

    const [meals, expenses] = await Promise.all([
        getDocsData(mealsQuery),
        getDocsData(expensesQuery),
    ]);

    // 3. Process data for each member
    const membersData = users.map(user => {
      const memberMeals = meals.filter(m => m.userId === user.id);
      const memberExpenses = expenses.filter(e => e.userId === user.id);
      
      const totalMeals = memberMeals.length;

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
        name: user.email.split('@')[0], // Basic name generation
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
