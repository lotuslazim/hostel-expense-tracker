import type { Meal, Expense, Item } from './types';
import type { GenerateMonthlySummaryInput } from '@/ai/flows/generate-monthly-summary';


// Mock data for demonstration purposes
export const MOCK_MEALS: Meal[] = [];

export const MOCK_EXPENSES: Expense[] = [
  { id: '1', description: 'Groceries', amount: 75.50, category: 'Food', date: new Date() },
  { id: '2', description: 'Coffee', amount: 4.25, category: 'Dining Out', date: new Date() },
];

export const MOCK_ITEMS: Item[] = [
  { id: '1', name: 'Apples', quantity: 6, unit: 'pcs', cost: 3.99, date: new Date() },
  { id: '2', name: 'Almond Milk', quantity: 1, unit: 'carton', cost: 2.50, date: new Date() },
];

// Summaries for GenAI
export const MOCK_WEEKLY_DATA = {
    meals: "Logged oatmeal for breakfast consistently. Lunch varied between salads and sandwiches. Dinner was logged only 3 times, mostly pasta dishes. Multiple snacks like apples and yogurt were logged.",
    expenses: "Total spending was $250. The largest category was 'Groceries' at $150. 'Dining Out' accounted for $60, and the rest was on 'Transportation' and 'Entertainment'.",
    items: "Purchased a variety of fruits and vegetables, including apples, bananas, and spinach. Also bought staples like almond milk, bread, and chicken breast."
}

export const MOCK_MONTHLY_DATA: GenerateMonthlySummaryInput = {
  month: "September 2025",
  dailyData: [
    { day: 1, meals: 2, foodExpense: 550, electricityBill: 0, gasBill: 0 },
    { day: 2, meals: 3, foodExpense: 450, electricityBill: 0, gasBill: 0 },
    { day: 3, meals: 1, foodExpense: 200, electricityBill: 0, gasBill: 0 },
    { day: 4, meals: 2, foodExpense: 600, electricityBill: 0, gasBill: 0 },
    { day: 5, meals: 3, foodExpense: 750, electricityBill: 1200, gasBill: 0 },
    { day: 6, meals: 2, foodExpense: 300, electricityBill: 0, gasBill: 0 },
    { day: 7, meals: 0, foodExpense: 1500, electricityBill: 0, gasBill: 500 },
  ],
};

export const MOCK_MONTHLY_GROUP_DATA = {
  month: "September 2025",
  members: [
    { name: "Alice", meals: 45, expenses: 8000 },
    { name: "Bob", meals: 60, expenses: 6000 },
    { name: "Charlie", meals: 55, expenses: 7500 },
  ],
};
