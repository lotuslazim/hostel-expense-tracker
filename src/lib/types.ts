export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  type: MealType;
  description: string;
  calories: number;
  loggedAt: Date;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  receiptUrl?: string;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  date: Date;
}
