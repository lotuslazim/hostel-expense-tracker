import type {
  Timestamp,
} from "firebase/firestore";

/* ======================================================
   Meals
====================================================== */

export type MealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack";

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

  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/* ======================================================
   Expenses
====================================================== */

export type ExpenseCategory =
  | "Food & Groceries"
  | "Electricity"
  | "Gas"
  | "Other";

export interface PurchasedItem {
  name: string;

  /*
   * Grocery quantity decimal হতে পারে।
   * পুরোনো saved data-তে null থাকলেও error হবে না।
   */
  quantity?: number | null;
  unit?: string | null;

  /*
   * Item-এর মোট মূল্য।
   */
  cost: number;

  /*
   * Shopping List item থেকে purchase হলে।
   */
  shoppingItemId?: string | null;

  /*
   * Inventory integration-এর জন্য optional reference।
   */
  inventoryItemId?: string | null;
}

export interface Expense {
  id: string;

  expenseItem: string;
  amount: number;
  category: ExpenseCategory;

  date: Date | Timestamp;

  userId: string;
  groupId: string;

  userName?: string;
  userPhotoURL?: string | null;

  description?: string | null;

  quantity?: number | null;
  unit?: string | null;

  receiptPhotoUrl?: string | null;
  receiptImageUrl?: string | null;

  purchasedItems?: PurchasedItem[];

  /*
   * Shopping List-এর একটি item সরাসরি expense-এর
   * সঙ্গে link করা থাকলে।
   */
  linkedShoppingItemId?: string | null;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;

  /*
   * Admin edit audit fields।
   */
  lastEditedBy?: string | null;
  lastEditedByName?: string | null;
  lastEditedAt?: Timestamp | null;
  editReason?: string | null;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  date: Date | Timestamp;
}

/* ======================================================
   Shopping List
====================================================== */

export type ShoppingItemStatus =
  | "needed"
  | "claimed"
  | "completed";

export type ShoppingItemPriority =
  | "normal"
  | "urgent";

export interface ShoppingItem {
  id: string;

  /*
   * কী বাজার লাগবে।
   */
  name: string;

  /*
   * Quantity optional।
   * Rice — 5 kg অথবা শুধু Salt লেখা যাবে।
   */
  quantity?: number | null;
  unit?: string | null;

  note?: string | null;

  priority: ShoppingItemPriority;
  status: ShoppingItemStatus;

  /*
   * কোন group-এর shopping item।
   */
  groupId: string;

  /*
   * কে item যোগ করেছে।
   */
  addedBy: string;
  addedByName: string;

  createdAt: Timestamp;
  updatedAt?: Timestamp;

  /*
   * “আমি আনব” চাপলে এই তথ্য থাকবে।
   */
  claimedBy?: string | null;
  claimedByName?: string | null;
  claimedAt?: Timestamp | null;

  /*
   * Expense-এর মাধ্যমে complete হলে।
   */
  completedBy?: string | null;
  completedByName?: string | null;
  completedAt?: Timestamp | null;

  linkedExpenseId?: string | null;
}
