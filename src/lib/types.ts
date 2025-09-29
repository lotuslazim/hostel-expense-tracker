
import type { Timestamp } from 'firebase/firestore';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  mealType: MealType;
  description: string;
  mealNumber: number;
  date: Date | Timestamp;
  userId: string;
  groupId: string;
  userName?: string;
}

export type ExpenseCategory = 'Food & Groceries' | 'Other';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  quantity?: number;
  date: Date | Timestamp;
  receiptPhotoUrl?: string;
  userId: string;
  groupId: string;
  userName?: string;
}

export interface PurchasedItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  date: Date | Timestamp;
  userId: string;
  groupId: string;
  userName?: string;
}
