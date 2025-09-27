
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  mealType: MealType;
  description: string;
  date: Date;
  userId: string;
  groupId: string;
  userName?: string;
}

export type ExpenseCategory = 'Food' | 'Electricity' | 'Gas' | 'Other';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: Date;
  receiptUrl?: string;
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
  date: Date;
  userId: string;
  groupId: string;
  userName?: string;
}
