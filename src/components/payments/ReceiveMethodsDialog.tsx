"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Loader2, Plus, ShieldCheck, Star, Trash2, Wallet } from "lucide-react";

import { useDoc } from "@/firebase";
import { firestore } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { MethodChip, MethodPicker } from "@/components/payments/PaymentBits";
import {
  DIGITAL_METHOD_TYPES,
  type DigitalMethodType,
  isValidWalletNumber,
  newMethodId,
  normalizePhone,
  PAYMENT_METHODS,
  type ReceiveMethod,
  type ReceiveMethodsDoc,
  receiveMethodSummary,
  WALLET_ACCOUNT_TYPE_LABELS,
  type WalletAccountType,
} from "@/lib/payments";
import { sanitizeFirestoreData } from "@/lib/utils";

const MAX_METHODS = 8;

type DraftMethod = {
  type: DigitalMethodType;
  number: string;
  accountType: WalletAccountType;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  routingNumber: string;
};

const emptyDraft = (): DraftMethod => ({
  type: "bkash",
  number: "",
  accountType: "personal",
  bankName: "",
  accountName: "",
  accountNumber: "",
  branch: "",
  routingNumber: "",
});

/*
 * প্রত্যেক মেম্বার এখানে নিজের টাকা নেওয়ার মাধ্যম রাখে।
 * Path: groups/{groupId}/receiveMethods/{userId}
 * শুধু নিজের ডকুমেন্ট লেখা যায় (Firestore rule দিয়ে নিশ্চিত)।
 */
export function ReceiveMethodsDialog({
  groupId,
  userId,
  displayName,
  trigger,
}: {
  groupId: string;
  userId: string;
  displayName: string;
  trigger?: ReactNode;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [methods, setMethods] = useState<ReceiveMethod[]>([]);
  const [draft, setDraft] = useState<DraftMethod>(emptyDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const docRef = useMemo(
    () => doc(firestore, "groups", groupId, "receiveMethods", userId),
    [groupId, userId]
  );

  const { data, isLoading } = useDoc<ReceiveMethodsDoc>(docRef);

  /*
   * ডায়ালগ খোলা অবস্থায় সার্ভারের নতুন ডেটা এলে, ইউজার কিছু না বদলালে
   * তবেই লিস্ট আপডেট হবে; বদলালে তার এডিট মুছে যাবে না।
   */
  useEffect(() => {
    if (!open || isDirty) return;
    setMethods(data?.methods ?? []);
  }, [open, data, isDirty]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setIsDirty(false);
      setDraft(emptyDraft());
    }
  };

  const draftError = useMemo(() => {
    if (draft.type === "bank") {
      if (!draft.bankName.trim()) return "Bank name is required.";
      if (!draft.accountName.trim()) return "Account name is required.";
      if (!/^\d{6,20}$/.test(draft.accountNumber.replace(/\s|-/g, "")))
        return "Account number must be 6–20 digits.";
      return "";
    }

    if (!isValidWalletNumber(draft.type, draft.number))
      return draft.type === "rocket"
        ? "Enter an 11 or 12 digit Rocket number (01XXXXXXXXX)."
        : "Enter an 11 digit mobile number (01XXXXXXXXX).";

    return "";
  }, [draft]);

  const addDraft = () => {
    if (draftError || methods.length >= MAX_METHODS) return;

    const method: ReceiveMethod =
      draft.type === "bank"
        ? {
            id: newMethodId(),
            type: "bank",
            bankName: draft.bankName.trim(),
            accountName: draft.accountName.trim(),
            accountNumber: draft.accountNumber.replace(/\s|-/g, ""),
            branch: draft.branch.trim() || null,
            routingNumber: draft.routingNumber.replace(/\D/g, "") || null,
            isPrimary: methods.length === 0,
          }
        : {
            id: newMethodId(),
            type: draft.type,
            number: normalizePhone(draft.number),
            accountType: draft.accountType,
            isPrimary: methods.length === 0,
          };

    setMethods((previous) => [...previous, method]);
    setDraft(emptyDraft());
    setIsDirty(true);
  };

  const removeMethod = (id: string) => {
    setMethods((previous) => {
      const next = previous.filter((method) => method.id !== id);
      if (next.length > 0 && !next.some((method) => method.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
    setIsDirty(true);
  };

  const makePrimary = (id: string) => {
    setMethods((previous) =>
      previous.map((method) => ({ ...method, isPrimary: method.id === id }))
    );
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await setDoc(docRef, {
        userId,
        displayName: displayName.slice(0, 80) || "Member",
        methods: methods.map((method) => sanitizeFirestoreData(method)),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Payment numbers saved",
        description: "Group members will see these when they pay you.",
      });
      handleOpenChange(false);
    } catch (error) {
      console.error("Receive methods save error:", error);
      toast({
        variant: "destructive",
        title: "Could not save",
        description: "Check that the latest Firestore rules are deployed.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline" size="sm" className="gap-2">
            <Wallet className="h-4 w-4" />
            My payment numbers
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            My payment numbers
          </DialogTitle>
          <DialogDescription>
            Where group members should send money when they settle with you.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Only add numbers you are happy to share with your group. Never
            share your PIN or OTP with anyone — BachelorBite will never ask
            for them.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}

          {!isLoading && methods.length === 0 && (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              No payment numbers yet.
            </p>
          )}

          {methods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between gap-2 rounded-md border p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <MethodChip method={method.type} />
                  {method.isPrimary && (
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Primary
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm font-medium">
                  {receiveMethodSummary(method)}
                </p>
                {method.type === "bank" ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {method.accountName}
                    {method.branch ? ` · ${method.branch}` : ""}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {WALLET_ACCOUNT_TYPE_LABELS[method.accountType ?? "personal"]}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 gap-1">
                {!method.isPrimary && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => makePrimary(method.id)}
                    title="Make primary"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeMethod(method.id)}
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {methods.length < MAX_METHODS && (
          <div className="space-y-3 rounded-md border p-3">
            <p className="text-sm font-medium">Add a method</p>

            <MethodPicker
              options={DIGITAL_METHOD_TYPES}
              value={draft.type}
              onChange={(type) =>
                setDraft((previous) => ({
                  ...previous,
                  type: type as DigitalMethodType,
                }))
              }
            />

            {draft.type === "bank" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="rm-bank">Bank name</Label>
                  <Input
                    id="rm-bank"
                    placeholder="e.g. Dutch-Bangla Bank"
                    value={draft.bankName}
                    maxLength={60}
                    onChange={(event) =>
                      setDraft((p) => ({ ...p, bankName: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="rm-acname">Account name</Label>
                  <Input
                    id="rm-acname"
                    placeholder="As written in the bank"
                    value={draft.accountName}
                    maxLength={80}
                    onChange={(event) =>
                      setDraft((p) => ({ ...p, accountName: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="rm-acno">Account number</Label>
                  <Input
                    id="rm-acno"
                    inputMode="numeric"
                    value={draft.accountNumber}
                    maxLength={24}
                    onChange={(event) =>
                      setDraft((p) => ({ ...p, accountNumber: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rm-branch">Branch (optional)</Label>
                  <Input
                    id="rm-branch"
                    value={draft.branch}
                    maxLength={60}
                    onChange={(event) =>
                      setDraft((p) => ({ ...p, branch: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rm-routing">Routing no. (optional)</Label>
                  <Input
                    id="rm-routing"
                    inputMode="numeric"
                    value={draft.routingNumber}
                    maxLength={9}
                    onChange={(event) =>
                      setDraft((p) => ({ ...p, routingNumber: event.target.value }))
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="rm-number">
                    {PAYMENT_METHODS[draft.type].label} number
                  </Label>
                  <Input
                    id="rm-number"
                    inputMode="numeric"
                    placeholder="01XXXXXXXXX"
                    value={draft.number}
                    maxLength={14}
                    onChange={(event) =>
                      setDraft((p) => ({ ...p, number: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Account type</Label>
                  <Select
                    value={draft.accountType}
                    onValueChange={(value) =>
                      setDraft((p) => ({
                        ...p,
                        accountType: value as WalletAccountType,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(WALLET_ACCOUNT_TYPE_LABELS) as WalletAccountType[]).map(
                        (type) => (
                          <SelectItem key={type} value={type}>
                            {WALLET_ACCOUNT_TYPE_LABELS[type]}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {draftError && (
              <p className="text-xs text-muted-foreground">{draftError}</p>
            )}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={addDraft}
              disabled={Boolean(draftError)}
            >
              <Plus className="h-4 w-4" />
              Add to list
            </Button>
          </div>
        )}

        <Button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={isSaving || !isDirty}
          className="w-full"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}
