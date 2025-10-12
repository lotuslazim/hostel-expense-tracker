
import type { Timestamp } from 'firebase/firestore';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealLog {
  id: string;
  mealType: MealType;
  description: string;
  mealNumber: number;
  date: Date | Timestamp;
  userId: string;
  groupId: string;
  userName?: string;
  itemName?: string | null;
}

export type ExpenseCategory = 'Food & Groceries' | 'Electricity' | 'Gas' | 'Other';

export interface Expense {
  id: string;
  description?: string; // Kept for backward compatibility
  expenseItem: string;
  amount: number;
  category: ExpenseCategory;
  quantity?: number;
  date: Date | Timestamp;
  receiptPhotoUrl?: string;
  userId: string;
  groupId: string;
  userName?: string;
}

export interface ChatMessage {
  id: string;
  text?: string;
  imageUrl?: string;
  createdAt: Timestamp;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  groupId: string;
}

export interface Reminder {
    id: string;
    groupId: string;
    senderId: string;
    senderName: string;
    messageText: string;
    createdAt: Timestamp;
}

export interface FoodItem {
    id: string;
    name: string;
    requiredQuantity: number;
    unit: string;
    category: string;
    groupId: string;
    createdAt: Timestamp;
}

export interface Purchase {
    id: string;
    itemId?: string; // Optional because a purchase might not be linked to a master item
    itemName: string;
    quantity: number;
    cost: number;
    unit: string;
    unitPrice: number;
    date: Timestamp;
    userId: string;
    userName: string;
    groupId: string;
}

export interface PurchasedItem {
    name: string;
    quantity: number;
    unit: string;
    cost: number;
}

    
export interface Item {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  date: Date;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  groupId: string | null;
  isAdmin: boolean;
}

export interface Member {
  id: string; // This will be the same as the user's UID
  role: 'admin' | 'member';
  status: 'active' | 'inactive';
  joinedAt: Timestamp;
  leftAt?: Timestamp | null;
}
