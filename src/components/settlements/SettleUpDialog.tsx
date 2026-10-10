"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { Clock, ImagePlus, Loader2, ShieldCheck, Wallet, X } from "lucide-react";

import { useCollection, useDoc } from "@/firebase";
import { firestore } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";
import {
  CopyRow,
  MethodChip,
  StepsList,
  UssdButton,
} from "@/components/payments/PaymentBits";
import {
  buildClaimId,
  isValidTrxId,
  maskNumber,
  normalizeTrxId,
  PAYMENT_METHODS,
  type PaymentClaim,
  type PaymentMethodType,
  type ReceiveMethod,
  type ReceiveMethodsDoc,
  receiveMethodSummary,
  sendStepsFor,
  WALLET_ACCOUNT_TYPE_LABELS,
} from "@/lib/payments";

export type SettleMember = {
  id: string;
  name: string;
  /* +ve = পাবে, -ve = দেবে। */
  balance?: number;
};

const CASH = "cash";

const compressImage = async (file: File): Promise<File> => {
  const imageCompression = (await import("browser-image-compression")).default;
  const blob = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1280 });
  return new File([blob], file.name, { type: blob.type });
};

/*
 * Monthly Summary আর Settlement History — দুই জায়গাতেই এই একটাই
 * ডায়ালগ ব্যবহার হয় (আগে একই কোড দুই ফাইলে কপি করা ছিল)।
 *
 * মেম্বার নিজে: প্রাপক বেছে নেয় → প্রাপকের নম্বর কপি করে নিজের অ্যাপে
 * পাঠায় → TrxID জমা দেয় → status "pending"। প্রাপক Dashboard-এর
 * Payments কার্ড থেকে Confirm করলে সেটেলমেন্ট রেকর্ড তৈরি হয়।
 *
 * অ্যাডমিন: চাইলে আগের মতো সরাসরি রেকর্ড করতে পারে।
 */
export function SettleUpDialog({
  member,
  amountDue,
  month,
  year,
  groupId,
  currentUserId,
  currentUserName,
  members,
  currentUserIsAdmin,
  triggerClassName,
}: {
  member: SettleMember;
  amountDue: number;
  month: number;
  year: number;
  groupId: string;
  currentUserId: string;
  currentUserName: string;
  members: SettleMember[];
  currentUserIsAdmin: boolean;
  triggerClassName?: string;
}) {
  const { toast } = useToast();
  const isSelf = currentUserId === member.id;
  const owes = Math.round(amountDue) > 0;
  const canOpen = isSelf || currentUserIsAdmin;

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"pay" | "record">(isSelf && owes ? "pay" : "record");

  const [payeeId, setPayeeId] = useState("");
  const [methodKey, setMethodKey] = useState<string>("");
  const [amount, setAmount] = useState<string>(String(Math.max(Math.round(amountDue), 0)));
  const [trxId, setTrxId] = useState("");
  const [note, setNote] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Admin direct-record fields (আগের ফ্লো) */
  const [recordPayeeId, setRecordPayeeId] = useState("");
  const [recordMethod, setRecordMethod] = useState("");

  /* এই মাসে এই মেম্বারের সেটেলমেন্ট পেমেন্ট আগে জমা পড়েছে কিনা। */
  const claimsQuery = useMemo(
    () =>
      query(
        collection(firestore, "groups", groupId, "paymentClaims"),
        where("payerId", "==", member.id),
        where("kind", "==", "settlement"),
        where("month", "==", month),
        where("year", "==", year)
      ),
    [groupId, member.id, month, year]
  );
  const { data: claims } = useCollection<PaymentClaim>(claimsQuery);
  const pendingClaim = claims?.find((claim) => claim.status === "pending");
  const lastDisputed = claims?.find((claim) => claim.status === "disputed");

  const otherMembers = useMemo(
    () =>
      members
        .filter((m) => m.id !== member.id)
        .sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0)),
    [members, member.id]
  );

  /* ডিফল্ট প্রাপক: যে সবচেয়ে বেশি টাকা পাবে। */
  useEffect(() => {
    if (!open) return;
    setMode(isSelf && owes ? "pay" : "record");
    setAmount(String(Math.max(Math.round(amountDue), 0)));
    if (!payeeId && otherMembers.length > 0) {
      setPayeeId(otherMembers[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const payeeMethodsRef = useMemo(
    () => (payeeId ? doc(firestore, "groups", groupId, "receiveMethods", payeeId) : null),
    [groupId, payeeId]
  );
  const { data: payeeMethodsDoc, isLoading: arePayeeMethodsLoading } =
    useDoc<ReceiveMethodsDoc>(payeeMethodsRef);

  const payeeMethods: ReceiveMethod[] = useMemo(() => {
    const list = payeeMethodsDoc?.methods ?? [];
    return [...list].sort((a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)));
  }, [payeeMethodsDoc]);

  /* প্রাপক বদলালে তার primary মাধ্যম বেছে নিই। */
  useEffect(() => {
    if (arePayeeMethodsLoading) return;
    setMethodKey(payeeMethods[0]?.id ?? CASH);
  }, [payeeId, payeeMethods, arePayeeMethodsLoading]);

  const selectedMethod = payeeMethods.find((m) => m.id === methodKey) ?? null;
  const methodType: PaymentMethodType = selectedMethod ? selectedMethod.type : "cash";
  const needsTrx = PAYMENT_METHODS[methodType].needsTrxId;
  const payee = otherMembers.find((m) => m.id === payeeId);

  const amountNumber = Number(amount);
  const amountValid = Number.isInteger(amountNumber) && amountNumber > 0 && amountNumber <= 1_000_000;
  const trxValid = !needsTrx || isValidTrxId(trxId);
  const canSubmit = Boolean(payee) && amountValid && trxValid && !isSaving;

  const resetForm = () => {
    setTrxId("");
    setNote("");
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshot(null);
    setScreenshotPreview(null);
    setRecordMethod("");
    setRecordPayeeId("");
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
      setScreenshot(compressed);
      setScreenshotPreview(URL.createObjectURL(compressed));
    } catch (error) {
      console.error("Screenshot compression error:", error);
      toast({ variant: "destructive", title: "Could not read that image." });
    }
  };

  const paidToLabel = (): string | null => {
    if (!selectedMethod) return "Cash";
    if (selectedMethod.type === "bank") {
      return `${selectedMethod.bankName ?? "Bank"} ${maskNumber(selectedMethod.accountNumber)}`;
    }
    return `${PAYMENT_METHODS[selectedMethod.type].label} ${maskNumber(selectedMethod.number)}`;
  };

  const handleSubmitPayment = async () => {
    if (!canSubmit || !payee) return;

    setIsSaving(true);

    const normalizedTrx = needsTrx ? normalizeTrxId(trxId) : null;
    const claimId = buildClaimId(methodType, normalizedTrx, currentUserId);
    const claimRef = doc(firestore, "groups", groupId, "paymentClaims", claimId);

    try {
      if (normalizedTrx) {
        const existing = await getDoc(claimRef);
        if (existing.exists()) {
          toast({
            variant: "destructive",
            title: "Transaction ID already used",
            description: "This Transaction ID was already submitted in your group.",
          });
          return;
        }
      }

      let screenshotUrl: string | null = null;
      if (screenshot) {
        screenshotUrl = await uploadToCloudinary(
          screenshot,
          process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
        );
      }

      await setDoc(claimRef, {
        groupId,
        kind: "settlement",
        method: methodType,
        trxId: normalizedTrx,
        amount: amountNumber,
        payerId: currentUserId,
        payerName: currentUserName.slice(0, 80) || "Member",
        payeeId: payee.id,
        payeeName: payee.name.slice(0, 80) || "Member",
        billType: null,
        expenseId: null,
        paidToLabel: paidToLabel()?.slice(0, 120) ?? null,
        month,
        year,
        screenshotUrl,
        note: note.trim().slice(0, 200) || null,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Payment submitted",
        description: `${payee.name} will be asked to confirm they received ৳${amountNumber}.`,
      });
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Settlement payment error:", error);
      toast({
        variant: "destructive",
        title: "Could not submit payment",
        description: "Check that the latest Firestore rules are deployed.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdminRecord = async () => {
    const recordPayee = otherMembers.find((m) => m.id === recordPayeeId);
    if (!recordPayee || !recordMethod.trim()) {
      toast({ variant: "destructive", title: "Please fill all fields." });
      return;
    }

    setIsSaving(true);

    try {
      await setDoc(doc(firestore, "groups", groupId, "settlements", `${member.id}-${month}-${year}`), {
        groupId,
        userId: member.id,
        month,
        year,
        settledAt: serverTimestamp(),
        settlementMethod: recordMethod.trim().slice(0, 200),
        settledTo: recordPayee.name,
        settledToId: recordPayee.id,
        recordedBy: currentUserId,
      });

      toast({ title: "Balance settled", description: `Settlement for ${member.name} has been recorded.` });
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Admin settlement error:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not save settlement." });
    } finally {
      setIsSaving(false);
    }
  };

  if (pendingClaim) {
    return (
      <div
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed px-3 text-[12px] font-medium text-muted-foreground",
          triggerClassName && "border-current"
        )}
        title={`৳${pendingClaim.amount} via ${PAYMENT_METHODS[pendingClaim.method].label}`}
      >
        <Clock className="h-3.5 w-3.5" />
        Waiting for {pendingClaim.payeeName ?? "confirmation"}
      </div>
    );
  }

  /* নিজে পাওনাদার হলে (অ্যাডমিন না হলে) কিছু করার নেই। */
  if (isSelf && !owes && !currentUserIsAdmin) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          disabled={!canOpen}
          className={
            triggerClassName ??
            "h-9 rounded-lg bg-[#f4c84a] px-4 text-[12px] font-semibold text-[#13251e] shadow-none hover:bg-[#ffda64]"
          }
        >
          {isSelf && owes ? "Pay & Settle" : "Settle Up"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isSelf ? "Settle your balance" : `Settle balance for ${member.name}`}
          </DialogTitle>
          <DialogDescription>
            {owes
              ? `${isSelf ? "You owe" : `${member.name} owes`} ৳${Math.round(amountDue).toLocaleString("en-IN")} for this month.`
              : `${isSelf ? "You are" : `${member.name} is`} owed money this month — others pay ${isSelf ? "you" : "them"}.`}
          </DialogDescription>
        </DialogHeader>

        {isSelf && owes && currentUserIsAdmin && (
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["pay", "record"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium",
                  mode === key ? "bg-background shadow-sm" : "text-muted-foreground"
                )}
              >
                {key === "pay" ? "Pay now" : "Record directly (admin)"}
              </button>
            ))}
          </div>
        )}

        {lastDisputed && (
          <Alert variant="destructive">
            <AlertTitle className="text-sm">Previous payment was marked “not received”</AlertTitle>
            <AlertDescription className="text-xs">
              {lastDisputed.payeeName}: {lastDisputed.disputeReason || "No reason given."}
            </AlertDescription>
          </Alert>
        )}

        {isSelf && owes && mode === "pay" ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Pay to</Label>
              <Select value={payeeId} onValueChange={setPayeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {otherMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                      {(m.balance ?? 0) > 0 ? ` — gets ৳${Math.round(m.balance ?? 0)}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {payee && (
              <div className="space-y-2">
                <Label>Method</Label>

                {arePayeeMethodsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading {payee.name}&apos;s payment numbers…</p>
                ) : (
                  <>
                    {payeeMethods.length === 0 && (
                      <Alert>
                        <Wallet className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {payee.name} hasn&apos;t added any payment numbers yet. Ask them to add one from
                          Dashboard → My payment numbers. You can still record a cash payment.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2" role="radiogroup">
                      {[...payeeMethods.map((m) => m.id), CASH].map((key) => {
                        const method = payeeMethods.find((m) => m.id === key);
                        const isActive = methodKey === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            role="radio"
                            aria-checked={isActive}
                            onClick={() => setMethodKey(key)}
                            className={cn(
                              "flex w-full items-center justify-between gap-2 rounded-md border p-2.5 text-left text-sm",
                              isActive ? "border-primary bg-primary/5" : "hover:bg-muted"
                            )}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <MethodChip method={method ? method.type : "cash"} />
                              <span className="truncate">
                                {method ? receiveMethodSummary(method) : "Paid in cash"}
                              </span>
                            </span>
                            {method?.isPrimary && (
                              <span className="text-[10px] text-muted-foreground">Primary</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {selectedMethod && (
              <div className="space-y-2">
                {selectedMethod.type === "bank" ? (
                  <>
                    <CopyRow label="Account name" value={selectedMethod.accountName ?? ""} mono={false} />
                    <CopyRow label={`${selectedMethod.bankName ?? "Bank"} · Account no.`} value={selectedMethod.accountNumber ?? ""} />
                    {selectedMethod.branch && (
                      <CopyRow label="Branch" value={selectedMethod.branch} mono={false} />
                    )}
                    {selectedMethod.routingNumber && (
                      <CopyRow label="Routing no." value={selectedMethod.routingNumber} />
                    )}
                  </>
                ) : (
                  <CopyRow
                    label={`${PAYMENT_METHODS[selectedMethod.type].label} · ${
                      WALLET_ACCOUNT_TYPE_LABELS[selectedMethod.accountType ?? "personal"]
                    }`}
                    value={selectedMethod.number ?? ""}
                  />
                )}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="settle-amount">Amount (৳)</Label>
              <div className="flex gap-2">
                <Input
                  id="settle-amount"
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))}
                />
                {amountValid && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard?.writeText(String(amountNumber));
                      toast({ title: "Amount copied" });
                    }}
                  >
                    Copy
                  </Button>
                )}
              </div>
            </div>

            {payee && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">How to pay</p>
                  <UssdButton method={methodType} />
                </div>
                <StepsList steps={sendStepsFor(methodType, selectedMethod?.accountType)} />
              </div>
            )}

            {needsTrx && (
              <div className="space-y-1">
                <Label htmlFor="settle-trx">Transaction ID</Label>
                <Input
                  id="settle-trx"
                  placeholder="e.g. 8N7A6D5E4F"
                  autoComplete="off"
                  autoCapitalize="characters"
                  value={trxId}
                  maxLength={30}
                  onChange={(event) => setTrxId(event.target.value)}
                  onBlur={() => setTrxId(normalizeTrxId(trxId))}
                  className="font-mono uppercase"
                />
                {trxId && !trxValid && (
                  <p className="text-xs text-destructive">Transaction ID should be 6–20 letters or numbers.</p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <Label>Screenshot (optional)</Label>
              {screenshotPreview ? (
                <div className="relative h-24 w-24">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={screenshotPreview} alt="Payment screenshot" className="h-full w-full rounded-md border object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                    onClick={() => {
                      if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
                      setScreenshot(null);
                      setScreenshotPreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" />
                  Add screenshot
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void handleFile(event);
                  event.target.value = "";
                }}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="settle-note">Note (optional)</Label>
              <Textarea
                id="settle-note"
                value={note}
                maxLength={200}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Send the money from your own app first. Your balance is settled
              when {payee?.name ?? "the receiver"} confirms they received it.
            </p>

            <Button
              type="button"
              className="w-full"
              disabled={!canSubmit}
              onClick={() => {
                void handleSubmitPayment();
              }}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {methodType === "cash" ? "I paid in cash" : "I've sent the money"}
            </Button>
          </div>
        ) : currentUserIsAdmin ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="settledTo">Who was paid?</Label>
              <Select value={recordPayeeId} onValueChange={setRecordPayeeId}>
                <SelectTrigger id="settledTo">
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {otherMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="paymentMethod">How was it paid?</Label>
              <Textarea
                id="paymentMethod"
                placeholder="e.g., Paid in cash, Sent via bKash"
                value={recordMethod}
                maxLength={200}
                onChange={(event) => setRecordMethod(event.target.value)}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Admin record — saved immediately without the receiver&apos;s confirmation.
            </p>

            <Button
              type="button"
              className="w-full"
              onClick={() => {
                void handleAdminRecord();
              }}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Settlement
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nothing to pay. Your balance is settled when the members who owe
            pay you and you confirm it in the Payments card on your dashboard.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
