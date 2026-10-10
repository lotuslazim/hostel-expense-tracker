"use client";

import { useState } from "react";
import { type DocumentReference, serverTimestamp, updateDoc } from "firebase/firestore";
import { Loader2, Pencil, Receipt, Trash2, Wifi, Zap } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MethodChip } from "@/components/payments/PaymentBits";
import {
  BILL_LABELS,
  type BillAccount,
  type BillKey,
  DIGITAL_METHOD_TYPES,
  type DigitalMethodType,
  type GroupBillAccounts,
  isBillAccountComplete,
  isValidWalletNumber,
  maskNumber,
  normalizePhone,
  PAYMENT_METHODS,
  WALLET_ACCOUNT_TYPE_LABELS,
  type WalletAccountType,
} from "@/lib/payments";

const ELECTRICITY_PROVIDERS = [
  "DESCO (Prepaid)",
  "DESCO (Postpaid)",
  "DPDC (Prepaid)",
  "DPDC (Postpaid)",
  "Palli Bidyut (BREB)",
  "BPDB",
  "NESCO",
  "WZPDCL",
];

type Draft = {
  providerName: string;
  accountNumber: string;
  meterNumber: string;
  accountHolder: string;
  payToMethod: DigitalMethodType | "none";
  payToNumber: string;
  payToAccountType: WalletAccountType;
  note: string;
};

const toDraft = (account?: BillAccount | null): Draft => ({
  providerName: account?.providerName ?? "",
  accountNumber: account?.accountNumber ?? "",
  meterNumber: account?.meterNumber ?? "",
  accountHolder: account?.accountHolder ?? "",
  payToMethod: account?.payToMethod ?? "none",
  payToNumber: account?.payToNumber ?? "",
  payToAccountType: account?.payToAccountType ?? "merchant",
  note: account?.note ?? "",
});

/*
 * অ্যাডমিন একবার বিদ্যুৎ ও Wi-Fi বিলের অ্যাকাউন্ট সেট করবে।
 * সেভ হয় groups/{groupId}.billAccounts-এ; group ডকুমেন্ট শুধু অ্যাডমিন
 * আপডেট করতে পারে (আগের rule-ই এটা নিশ্চিত করে)।
 */
export function BillAccountsCard({
  groupDocRef,
  billAccounts,
  adminId,
}: {
  groupDocRef: DocumentReference | null;
  billAccounts?: GroupBillAccounts | null;
  adminId: string;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<BillKey | null>(null);
  const [draft, setDraft] = useState<Draft>(toDraft());
  const [isSaving, setIsSaving] = useState(false);

  const openEditor = (key: BillKey) => {
    setDraft(toDraft(billAccounts?.[key]));
    setEditing(key);
  };

  const usesPayTo = draft.payToMethod !== "none";
  const payToNumberValid =
    !usesPayTo ||
    (draft.payToMethod === "bank"
      ? /^\d{6,20}$/.test(draft.payToNumber.replace(/\s|-/g, ""))
      : isValidWalletNumber(draft.payToMethod as DigitalMethodType, draft.payToNumber));

  const canSave =
    draft.providerName.trim().length > 0 &&
    draft.accountNumber.trim().length > 0 &&
    payToNumberValid;

  const handleSave = async () => {
    if (!groupDocRef || !editing || !canSave) return;

    setIsSaving(true);

    const payToMethod = usesPayTo ? (draft.payToMethod as DigitalMethodType) : null;

    const account: BillAccount = {
      providerName: draft.providerName.trim().slice(0, 80),
      accountNumber: draft.accountNumber.trim().slice(0, 40),
      meterNumber: draft.meterNumber.trim().slice(0, 40) || null,
      accountHolder: draft.accountHolder.trim().slice(0, 80) || null,
      payToMethod,
      payToNumber: payToMethod
        ? payToMethod === "bank"
          ? draft.payToNumber.replace(/\s|-/g, "")
          : normalizePhone(draft.payToNumber)
        : null,
      payToAccountType: payToMethod && payToMethod !== "bank" ? draft.payToAccountType : null,
      note: draft.note.trim().slice(0, 200) || null,
      updatedBy: adminId,
    };

    try {
      await updateDoc(groupDocRef, {
        [`billAccounts.${editing}`]: {
          ...account,
          updatedAt: serverTimestamp(),
        },
      });

      toast({
        title: `${BILL_LABELS[editing]} account saved`,
        description: "Members will now see it when they pay this bill.",
      });
      setEditing(null);
    } catch (error) {
      console.error("Bill account save error:", error);
      toast({
        variant: "destructive",
        title: "Could not save",
        description: "Only the group admin can change bill accounts.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async (key: BillKey) => {
    if (!groupDocRef) return;

    try {
      await updateDoc(groupDocRef, { [`billAccounts.${key}`]: null });
      toast({ title: `${BILL_LABELS[key]} account removed` });
    } catch (error) {
      console.error("Bill account clear error:", error);
      toast({ variant: "destructive", title: "Could not remove" });
    }
  };

  const renderRow = (key: BillKey) => {
    const account = billAccounts?.[key];
    const Icon = key === "electricity" ? Zap : Wifi;

    return (
      <div key={key} className="flex items-start justify-between gap-3 rounded-lg border p-3">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
            <Icon className="h-4 w-4" />
          </span>

          <div className="min-w-0">
            <p className="font-medium">{BILL_LABELS[key]}</p>

            {isBillAccountComplete(account) ? (
              <>
                <p className="truncate text-sm">
                  {account.providerName} ·{" "}
                  <span className="font-mono">{account.accountNumber}</span>
                </p>
                {account.meterNumber && (
                  <p className="text-xs text-muted-foreground">
                    Meter: <span className="font-mono">{account.meterNumber}</span>
                  </p>
                )}
                {account.payToMethod && account.payToNumber && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    Pay to <MethodChip method={account.payToMethod} />
                    <span className="font-mono">{maskNumber(account.payToNumber)}</span>
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not set yet</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => openEditor(key)}
          >
            <Pencil className="h-3.5 w-3.5" />
            {account ? "Edit" : "Set"}
          </Button>

          {account && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => {
                void handleClear(key);
              }}
              title="Remove"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Bill Accounts
        </CardTitle>
        <CardDescription>
          Set these once. Members see them with a Copy button when they pay a
          bill, so nobody has to remember account numbers.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {renderRow("electricity")}
        {renderRow("wifi")}
      </CardContent>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? `${BILL_LABELS[editing]} account` : "Bill account"}
            </DialogTitle>
            <DialogDescription>
              {editing === "wifi"
                ? "Your ISP name and the customer / user ID they gave you."
                : "Your electricity provider and the account or meter number used in Pay Bill."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="ba-provider">
                {editing === "wifi" ? "ISP name" : "Provider"}
              </Label>
              <Input
                id="ba-provider"
                list={editing === "electricity" ? "ba-provider-list" : undefined}
                placeholder={editing === "wifi" ? "e.g. Link3, Carnival, local ISP" : "e.g. DESCO (Prepaid)"}
                value={draft.providerName}
                maxLength={80}
                onChange={(event) => setDraft((p) => ({ ...p, providerName: event.target.value }))}
              />
              {editing === "electricity" && (
                <datalist id="ba-provider-list">
                  {ELECTRICITY_PROVIDERS.map((provider) => (
                    <option key={provider} value={provider} />
                  ))}
                </datalist>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="ba-account">
                {editing === "wifi" ? "Customer / user ID" : "Account number"}
              </Label>
              <Input
                id="ba-account"
                value={draft.accountNumber}
                maxLength={40}
                onChange={(event) => setDraft((p) => ({ ...p, accountNumber: event.target.value }))}
              />
            </div>

            {editing === "electricity" && (
              <div className="space-y-1">
                <Label htmlFor="ba-meter">Meter number (optional)</Label>
                <Input
                  id="ba-meter"
                  value={draft.meterNumber}
                  maxLength={40}
                  onChange={(event) => setDraft((p) => ({ ...p, meterNumber: event.target.value }))}
                />
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="ba-holder">Account holder name (optional)</Label>
              <Input
                id="ba-holder"
                value={draft.accountHolder}
                maxLength={80}
                onChange={(event) => setDraft((p) => ({ ...p, accountHolder: event.target.value }))}
              />
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <Label>Pay to a number instead of Pay Bill? (optional)</Label>
              <p className="text-xs text-muted-foreground">
                Some ISPs and landlords ask you to send money to their bKash /
                Nagad number with your customer ID as reference.
              </p>

              <Select
                value={draft.payToMethod}
                onValueChange={(value) =>
                  setDraft((p) => ({ ...p, payToMethod: value as Draft["payToMethod"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No — members use Pay Bill</SelectItem>
                  {DIGITAL_METHOD_TYPES.map((method) => (
                    <SelectItem key={method} value={method}>
                      {PAYMENT_METHODS[method].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {usesPayTo && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    inputMode="numeric"
                    placeholder={draft.payToMethod === "bank" ? "Bank account number" : "01XXXXXXXXX"}
                    value={draft.payToNumber}
                    maxLength={24}
                    onChange={(event) => setDraft((p) => ({ ...p, payToNumber: event.target.value }))}
                  />

                  {draft.payToMethod !== "bank" && (
                    <Select
                      value={draft.payToAccountType}
                      onValueChange={(value) =>
                        setDraft((p) => ({ ...p, payToAccountType: value as WalletAccountType }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(WALLET_ACCOUNT_TYPE_LABELS) as WalletAccountType[]).map((type) => (
                          <SelectItem key={type} value={type}>
                            {WALLET_ACCOUNT_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {usesPayTo && !payToNumberValid && (
                <p className="text-xs text-destructive">Enter a valid number.</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="ba-note">Note for members (optional)</Label>
              <Textarea
                id="ba-note"
                placeholder="e.g. Pay before the 10th. Write flat 4B in reference."
                value={draft.note}
                maxLength={200}
                onChange={(event) => setDraft((p) => ({ ...p, note: event.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleSave();
              }}
              disabled={!canSave || isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
