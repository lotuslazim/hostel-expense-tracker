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
  dateKey?: string;

  userId: string;
  groupId: string;

  userName?: string;
  itemName?: string | null;

  createdAt: Timestamp;
  updatedAt?: Timestamp;

  createdActivityId?: string;
  undoActivityId?: string;

  /*
   * Admin correction audit fields.
   */
  lastEditedBy?: string | null;
  lastEditedByName?: string | null;
  lastEditedAt?: Timestamp | null;
  editReason?: string | null;
  lastActivityId?: string | null;
}

/* ======================================================
   Expenses
====================================================== */

export type ExpenseCategory =
  | "Food & Groceries"
  | "Electricity"
  | "Gas"
  | "Wi-Fi"
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

  /*
   * Electricity / Wi-Fi বিল অনলাইনে দিলে (Assisted Payment)।
   */
  paymentMethod?: import("./payments").PaymentMethodType | null;
  trxId?: string | null;
  paymentClaimId?: string | null;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;

  createdActivityId?: string;
  undoActivityId?: string;

  /*
   * Admin edit audit fields।
   */
  lastEditedBy?: string | null;
  lastEditedByName?: string | null;
  lastEditedAt?: Timestamp | null;
  editReason?: string | null;
}

export interface Purchase {
  id: string;
  itemId?: string;
  itemName: string;
  quantity: number;
  cost: number;
  unit: string;
  unitPrice?: number;
  date: Date | Timestamp;
  userId: string;
  userName?: string;
  groupId: string;
  expenseId?: string;
  shoppingItemId?: string | null;
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

/* ======================================================
   Group members and settlements
====================================================== */

export interface Member {
  id: string;
  joinedAt: Timestamp;
  leftAt?: Timestamp | null;
  role?: "admin" | "member";
  status?: "active" | "inactive";
  displayName?: string;
  userName?: string;
  email?: string;
  photoURL?: string | null;
}

export interface Settlement {
  id?: string;
  groupId: string;
  userId: string;
  month: number;
  year: number;
  settledTo: string;
  settlementMethod: string;
  settledAt?: Date | Timestamp | null;

  /*
   * Assisted Payment থেকে আসা সেটেলমেন্টে থাকবে।
   * পুরনো ডেটায় না থাকলেও সমস্যা নেই।
   */
  settledToId?: string | null;
  claimId?: string | null;
  amount?: number | null;
  trxId?: string | null;
  confirmedBy?: string | null;
  recordedBy?: string | null;
}

export type {
  BillAccount,
  GroupBillAccounts,
  PaymentClaim,
  PaymentClaimStatus,
  PaymentMethodType,
  ReceiveMethod,
  ReceiveMethodsDoc,
} from "./payments";

/* ======================================================
   Messages and reminders
====================================================== */

export interface ChatMessage {
  id: string;
  text?: string | null;
  imageUrl?: string | null;
  createdAt?: Date | Timestamp | null;
  userId: string;
  userName?: string | null;
  userPhotoURL?: string | null;
  groupId?: string;
  readBy?: string[];
}

export interface Reminder {
  id?: string;
  groupId?: string;
  messageText: string;
  senderId: string;
  senderName: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  isPinned?: boolean;
}
