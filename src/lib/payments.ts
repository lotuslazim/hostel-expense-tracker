import type { Timestamp } from "firebase/firestore";

/*
 * ======================================================
 *  Assisted Payment
 * ======================================================
 *
 * BachelorBite কখনো নিজে টাকা ধরে না বা পাঠায় না।
 * অ্যাপ শুধু দেখায় "কোথায়, কত টাকা পাঠাতে হবে"; টাকা
 * পাঠানো হয় ইউজারের নিজের bKash/Nagad/Rocket/Upay/ব্যাংক
 * অ্যাপ থেকে। তারপর ইউজার TrxID জমা দেয় এবং অন্য পক্ষ
 * (প্রাপক অথবা অ্যাডমিন) সেটা Confirm করে।
 *
 * কেন এভাবে: Payment and Settlement Systems Act 2024 অনুযায়ী
 * লাইসেন্স ছাড়া অন্যের টাকা জমা রেখে আবার ভাগ করে দেওয়া যায় না,
 * আর merchant gateway শুধু merchant-এর নিজের অ্যাকাউন্টে
 * টাকা নেয়। তাই "নির্দেশনা + প্রমাণ + কনফার্মেশন" মডেল।
 *
 * নিরাপত্তা: PIN, OTP, পাসওয়ার্ড কখনো অ্যাপে চাওয়া বা রাখা হয় না।
 */

export type DigitalMethodType =
  | "bkash"
  | "nagad"
  | "rocket"
  | "upay"
  | "bank";

export type PaymentMethodType =
  | DigitalMethodType
  | "cash";

export type WalletAccountType =
  | "personal"
  | "merchant";

export type BillKey = "electricity" | "wifi";

export type BillCategory = "Electricity" | "Wi-Fi";

export type PaymentClaimKind = "bill" | "settlement";

export type PaymentClaimStatus =
  | "pending"
  | "confirmed"
  | "disputed";

export interface PaymentMethodInfo {
  type: PaymentMethodType;
  label: string;
  labelBn: string;
  /* Mobile wallet হলে USSD code (অ্যাপ না থাকলে ডায়াল করে পাঠানো যায়)। */
  ussd?: string;
  /* টাকা পাঠানোর ধাপ (অ্যাপের ভেতরে)। */
  sendSteps: string[];
  billSteps: string[];
  /* Tailwind classes for the small colored chip. */
  chipClass: string;
  isWallet: boolean;
  needsTrxId: boolean;
}

export const PAYMENT_METHODS: Record<PaymentMethodType, PaymentMethodInfo> = {
  bkash: {
    type: "bkash",
    label: "bKash",
    labelBn: "বিকাশ",
    ussd: "*247#",
    sendSteps: [
      "bKash অ্যাপ খুলুন → Send Money",
      "নম্বরটি পেস্ট করুন, টাকার পরিমাণ দিন",
      "PIN দিয়ে কনফার্ম করুন (PIN শুধু bKash অ্যাপে দেবেন)",
      "মেসেজে আসা TrxID এখানে লিখুন",
    ],
    billSteps: [
      "bKash অ্যাপ খুলুন → Pay Bill",
      "প্রোভাইডার বেছে নিন, অ্যাকাউন্ট নম্বর পেস্ট করুন",
      "PIN দিয়ে কনফার্ম করুন",
      "মেসেজে আসা TrxID এখানে লিখুন",
    ],
    chipClass: "border-pink-500/40 bg-pink-500/10 text-pink-600 dark:text-pink-300",
    isWallet: true,
    needsTrxId: true,
  },
  nagad: {
    type: "nagad",
    label: "Nagad",
    labelBn: "নগদ",
    ussd: "*167#",
    sendSteps: [
      "Nagad অ্যাপ খুলুন → Send Money",
      "নম্বরটি পেস্ট করুন, টাকার পরিমাণ দিন",
      "PIN দিয়ে কনফার্ম করুন",
      "মেসেজে আসা TxnID এখানে লিখুন",
    ],
    billSteps: [
      "Nagad অ্যাপ খুলুন → Bill Pay",
      "প্রোভাইডার বেছে নিন, অ্যাকাউন্ট নম্বর পেস্ট করুন",
      "PIN দিয়ে কনফার্ম করুন",
      "মেসেজে আসা TxnID এখানে লিখুন",
    ],
    chipClass: "border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-300",
    isWallet: true,
    needsTrxId: true,
  },
  rocket: {
    type: "rocket",
    label: "Rocket",
    labelBn: "রকেট",
    ussd: "*322#",
    sendSteps: [
      "Rocket অ্যাপ খুলুন → Send Money",
      "নম্বরটি পেস্ট করুন (Rocket নম্বরের শেষে চেক ডিজিট থাকে)",
      "PIN দিয়ে কনফার্ম করুন",
      "মেসেজে আসা TxnID এখানে লিখুন",
    ],
    billSteps: [
      "Rocket অ্যাপ খুলুন → Bill Pay",
      "প্রোভাইডার বেছে নিন, অ্যাকাউন্ট নম্বর পেস্ট করুন",
      "PIN দিয়ে কনফার্ম করুন",
      "মেসেজে আসা TxnID এখানে লিখুন",
    ],
    chipClass: "border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-300",
    isWallet: true,
    needsTrxId: true,
  },
  upay: {
    type: "upay",
    label: "Upay",
    labelBn: "উপায়",
    ussd: "*268#",
    sendSteps: [
      "Upay অ্যাপ খুলুন → Send Money",
      "নম্বরটি পেস্ট করুন, টাকার পরিমাণ দিন",
      "PIN দিয়ে কনফার্ম করুন",
      "মেসেজে আসা TxnID এখানে লিখুন",
    ],
    billSteps: [
      "Upay অ্যাপ খুলুন → Pay Bill",
      "প্রোভাইডার বেছে নিন, অ্যাকাউন্ট নম্বর পেস্ট করুন",
      "PIN দিয়ে কনফার্ম করুন",
      "মেসেজে আসা TxnID এখানে লিখুন",
    ],
    chipClass: "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-300",
    isWallet: true,
    needsTrxId: true,
  },
  bank: {
    type: "bank",
    label: "Bank",
    labelBn: "ব্যাংক",
    sendSteps: [
      "আপনার ব্যাংকের অ্যাপ খুলুন (NPSB / BEFTN / Fund Transfer)",
      "অ্যাকাউন্টের নাম, নম্বর আর ব্রাঞ্চ মিলিয়ে নিন",
      "ট্রান্সফার শেষে Reference / Transaction ID এখানে লিখুন",
    ],
    billSteps: [
      "আপনার ব্যাংকের অ্যাপ খুলুন → Bill Payment",
      "প্রোভাইডার বেছে নিন, অ্যাকাউন্ট নম্বর পেস্ট করুন",
      "Reference / Transaction ID এখানে লিখুন",
    ],
    chipClass: "border-slate-500/40 bg-slate-500/10 text-slate-600 dark:text-slate-300",
    isWallet: false,
    needsTrxId: true,
  },
  cash: {
    type: "cash",
    label: "Cash",
    labelBn: "নগদ টাকা (হাতে)",
    sendSteps: [
      "হাতে টাকা দিন",
      "এখানে জমা দিন, প্রাপক Confirm করলে সেটেল হবে",
    ],
    billSteps: [],
    chipClass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    isWallet: false,
    needsTrxId: false,
  },
};

export const DIGITAL_METHOD_TYPES: DigitalMethodType[] = [
  "bkash",
  "nagad",
  "rocket",
  "upay",
  "bank",
];

export const WALLET_ACCOUNT_TYPE_LABELS: Record<WalletAccountType, string> = {
  personal: "Personal (Send Money)",
  merchant: "Merchant (Payment)",
};

/* ------------------------------------------------------
 * Firestore document shapes
 * ---------------------------------------------------- */

/*
 * groups/{groupId}/receiveMethods/{userId}
 * প্রত্যেক মেম্বার নিজের টাকা গ্রহণের মাধ্যম রাখে।
 */
export interface ReceiveMethod {
  id: string;
  type: DigitalMethodType;

  /* Wallet (bKash/Nagad/Rocket/Upay) */
  number?: string | null;
  accountType?: WalletAccountType | null;

  /* Bank */
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  branch?: string | null;
  routingNumber?: string | null;

  isPrimary?: boolean;
}

export interface ReceiveMethodsDoc {
  userId: string;
  displayName: string;
  methods: ReceiveMethod[];
  updatedAt?: Timestamp;
}

/*
 * groups/{groupId}.billAccounts
 * অ্যাডমিন একবার সেট করবে, সবাই দেখবে।
 */
export interface BillAccount {
  providerName: string;
  accountNumber: string;
  meterNumber?: string | null;
  accountHolder?: string | null;

  /*
   * কিছু ISP / বাড়িওয়ালা Pay Bill নেয় না, একটা bKash/Nagad
   * নম্বরে টাকা পাঠাতে বলে। তখন এগুলো ব্যবহার হবে।
   */
  payToMethod?: DigitalMethodType | null;
  payToNumber?: string | null;
  payToAccountType?: WalletAccountType | null;

  note?: string | null;
  updatedBy?: string | null;
  updatedAt?: Timestamp | null;
}

export type GroupBillAccounts = Partial<Record<BillKey, BillAccount>>;

/*
 * groups/{groupId}/paymentClaims/{claimId}
 *
 * claimId = "<method>_<TRXID>" (যেমন "bkash_8N7A6D5E4F")।
 * একই TrxID দুবার জমা দিলে একই ID হবে, আর Firestore rule
 * পুরনো ডকুমেন্টের উপর নতুন create আটকে দেবে। একে বলে
 * idempotency key।
 *
 * Cash-এর TrxID নেই, তাই ID = "cash_<payerId>_<timestamp>"।
 */
export interface PaymentClaim {
  id: string;
  groupId: string;
  kind: PaymentClaimKind;
  method: PaymentMethodType;
  trxId: string | null;

  /* পূর্ণ টাকা (পয়সা নয়, দশমিক নয়)। */
  amount: number;

  payerId: string;
  payerName: string;

  /* Settlement হলে প্রাপক। */
  payeeId?: string | null;
  payeeName?: string | null;

  /* Bill হলে কোন বিল এবং কোন expense-এর সঙ্গে যুক্ত। */
  billType?: BillCategory | null;
  expenseId?: string | null;

  /* টাকা কোথায় পাঠানো হয়েছিল (দেখানোর জন্য, মাস্ক করা)। */
  paidToLabel?: string | null;

  month: number;
  year: number;

  screenshotUrl?: string | null;
  note?: string | null;

  status: PaymentClaimStatus;
  createdAt?: Timestamp;

  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: Timestamp | null;
  disputeReason?: string | null;
}

/* ------------------------------------------------------
 * Helpers
 * ---------------------------------------------------- */

export const billKeyOf = (
  category: string | undefined | null
): BillKey | null => {
  if (category === "Electricity") return "electricity";
  if (category === "Wi-Fi") return "wifi";
  return null;
};

export const BILL_LABELS: Record<BillKey, string> = {
  electricity: "Electricity",
  wifi: "Wi-Fi",
};

/*
 * TrxID: বড় হাতের অক্ষর আর সংখ্যা ছাড়া সব বাদ।
 * bKash সাধারণত ১০ অক্ষর, Nagad ৮, Rocket ১০ সংখ্যা,
 * ব্যাংক রেফারেন্স একটু লম্বা হতে পারে; তাই ৬–২০ রাখা হলো।
 */
export const normalizeTrxId = (value: string): string =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, "");

export const TRX_ID_PATTERN = /^[A-Z0-9]{6,20}$/;

export const isValidTrxId = (value: string): boolean =>
  TRX_ID_PATTERN.test(normalizeTrxId(value));

export const buildClaimId = (
  method: PaymentMethodType,
  trxId: string | null,
  payerId: string
): string => {
  if (method === "cash" || !trxId) {
    return `cash_${payerId}_${Date.now()}`;
  }

  return `${method}_${normalizeTrxId(trxId)}`;
};

/* বাংলাদেশি মোবাইল নম্বর: 01[3-9]XXXXXXXX (Rocket-এ শেষে চেক ডিজিট থাকে)। */
export const normalizePhone = (value: string): string => {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("880")) {
    digits = digits.slice(2);
  }

  return digits;
};

export const isValidWalletNumber = (
  type: DigitalMethodType,
  value: string
): boolean => {
  const digits = normalizePhone(value);

  if (type === "rocket") {
    return /^01[3-9]\d{8}\d?$/.test(digits);
  }

  return /^01[3-9]\d{8}$/.test(digits);
};

/* 01712345678 → 017••••5678 */
export const maskNumber = (value?: string | null): string => {
  if (!value) return "";
  const clean = value.replace(/\s/g, "");
  if (clean.length <= 7) return clean;
  return `${clean.slice(0, 3)}••••${clean.slice(-4)}`;
};

export const ussdHref = (ussd?: string): string | null =>
  ussd ? `tel:${ussd.replace(/#/g, "%23")}` : null;

export const formatTaka = (amount: number): string =>
  `৳${Math.round(amount).toLocaleString("en-IN")}`;

/*
 * Merchant নম্বরে "Send Money" হয় না, "Payment" মেনু লাগে।
 */
export const walletMenuName = (
  accountType?: WalletAccountType | null
): string => (accountType === "merchant" ? "Payment" : "Send Money");

export const sendStepsFor = (
  type: PaymentMethodType,
  accountType?: WalletAccountType | null
): string[] => {
  const steps = PAYMENT_METHODS[type].sendSteps;
  if (accountType !== "merchant") return steps;
  return steps.map((step) => step.replace("Send Money", "Payment"));
};

export const receiveMethodSummary = (method: ReceiveMethod): string => {
  const info = PAYMENT_METHODS[method.type];

  if (method.type === "bank") {
    return `${method.bankName || "Bank"} · ${maskNumber(method.accountNumber)}`;
  }

  return `${info.label} · ${maskNumber(method.number)}`;
};

export const billAccountSummary = (account?: BillAccount | null): string => {
  if (!account) return "";
  return `${account.providerName} · ${account.accountNumber}`;
};

export const newMethodId = (): string =>
  `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export const isBillAccountComplete = (
  account?: BillAccount | null
): account is BillAccount =>
  Boolean(account?.providerName?.trim() && account?.accountNumber?.trim());

export const CLAIM_STATUS_LABELS: Record<PaymentClaimStatus, string> = {
  pending: "Waiting for confirmation",
  confirmed: "Confirmed",
  disputed: "Not received",
};
