"use client";

import Link from "next/link";
import { AlertTriangle, CreditCard, Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  CopyRow,
  MethodPicker,
  StepsList,
  UssdButton,
} from "@/components/payments/PaymentBits";
import {
  BILL_LABELS,
  type BillAccount,
  type BillKey,
  DIGITAL_METHOD_TYPES,
  type DigitalMethodType,
  isBillAccountComplete,
  isValidTrxId,
  normalizeTrxId,
  PAYMENT_METHODS,
  sendStepsFor,
} from "@/lib/payments";

export type OnlineBillPayment = {
  enabled: boolean;
  method: DigitalMethodType;
  trxId: string;
};

export const defaultOnlineBillPayment = (
  account?: BillAccount | null
): OnlineBillPayment => ({
  enabled: false,
  method: account?.payToMethod ?? "bkash",
  trxId: "",
});

export const onlineBillPaymentError = (
  value: OnlineBillPayment
): string | null => {
  if (!value.enabled) return null;
  if (!value.trxId.trim()) return "Enter the Transaction ID from your payment SMS.";
  if (!isValidTrxId(value.trxId)) return "Transaction ID should be 6–20 letters or numbers.";
  return null;
};

/*
 * Add Expense ফর্মের ভেতরে, Electricity বা Wi-Fi বেছে নিলে দেখা যায়।
 * অ্যাপ টাকা পাঠায় না; শুধু অ্যাকাউন্ট নম্বর, টাকার পরিমাণ আর ধাপগুলো
 * দেখায়, তারপর TrxID নেয় যাতে অ্যাডমিন যাচাই করতে পারে।
 */
export function PayBillPanel({
  billKey,
  account,
  amount,
  value,
  onChange,
  isAdmin,
  disabled,
}: {
  billKey: BillKey;
  account?: BillAccount | null;
  amount: number | null;
  value: OnlineBillPayment;
  onChange: (next: OnlineBillPayment) => void;
  isAdmin: boolean;
  disabled?: boolean;
}) {
  const hasAccount = isBillAccountComplete(account);
  const usesPayTo = Boolean(account?.payToMethod && account?.payToNumber);
  const methodOptions: DigitalMethodType[] =
    usesPayTo && account?.payToMethod ? [account.payToMethod] : DIGITAL_METHOD_TYPES;

  const steps = usesPayTo
    ? sendStepsFor(value.method, account?.payToAccountType)
    : PAYMENT_METHODS[value.method].billSteps;

  const error = value.enabled && value.trxId ? onlineBillPaymentError(value) : null;

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={`pay-online-${billKey}`} className="flex flex-col gap-1">
          <span className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pay online & attach Transaction ID
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            bKash, Nagad, Rocket, Upay or bank. Your admin can verify it.
          </span>
        </Label>

        <Switch
          id={`pay-online-${billKey}`}
          checked={value.enabled}
          onCheckedChange={(checked) => onChange({ ...value, enabled: checked })}
          disabled={disabled}
        />
      </div>

      {value.enabled && (
        <>
          {!hasAccount ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{BILL_LABELS[billKey]} account not set</AlertTitle>
              <AlertDescription className="text-xs">
                {isAdmin ? (
                  <>
                    Add it once in{" "}
                    <Link href="/admin-profile" className="font-medium underline">
                      Admin Dashboard → Bill Accounts
                    </Link>
                    . You can still pay now and enter the Transaction ID.
                  </>
                ) : (
                  "Ask your admin to add it. You can still pay now and enter the Transaction ID."
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <CopyRow
                label={billKey === "wifi" ? `${account.providerName} · Customer ID` : `${account.providerName} · Account no.`}
                value={account.accountNumber}
              />

              {account.meterNumber && (
                <CopyRow label="Meter no." value={account.meterNumber} />
              )}

              {usesPayTo && account.payToNumber && account.payToMethod && (
                <CopyRow
                  label={`Send to (${PAYMENT_METHODS[account.payToMethod].label}${
                    account.payToAccountType === "merchant" ? " merchant" : ""
                  })`}
                  value={account.payToNumber}
                />
              )}

              {account.accountHolder && (
                <p className="text-xs text-muted-foreground">
                  Account holder: <span className="font-medium">{account.accountHolder}</span>
                </p>
              )}

              {account.note && (
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {account.note}
                </p>
              )}
            </div>
          )}

          {amount && amount > 0 ? (
            <CopyRow
              label="Amount"
              value={String(amount)}
              display={`৳${amount.toLocaleString("en-IN")}`}
            />
          ) : null}

          <div className="space-y-2">
            <Label className="text-xs">Paid with</Label>
            <MethodPicker
              options={methodOptions}
              value={value.method}
              onChange={(method) => onChange({ ...value, method: method as DigitalMethodType })}
              disabled={disabled}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">How to pay</p>
              <UssdButton method={value.method} />
            </div>
            <StepsList steps={steps} />
          </div>

          <div className="space-y-1">
            <Label htmlFor={`trx-${billKey}`}>Transaction ID</Label>
            <Input
              id={`trx-${billKey}`}
              placeholder="e.g. 8N7A6D5E4F"
              autoComplete="off"
              autoCapitalize="characters"
              value={value.trxId}
              maxLength={30}
              onChange={(event) => onChange({ ...value, trxId: event.target.value })}
              onBlur={() => onChange({ ...value, trxId: normalizeTrxId(value.trxId) })}
              disabled={disabled}
              className="font-mono uppercase"
            />
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Found in the confirmation SMS or app history. Each ID can only be used once.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
