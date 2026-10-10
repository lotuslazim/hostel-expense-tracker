"use client";

import { useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Timestamp,
} from "firebase/firestore";
import { format } from "date-fns/format";
import { Check, ExternalLink, Loader2, Undo2, Wallet, X } from "lucide-react";

import { useCollection } from "@/firebase";
import { firestore } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ClaimStatusBadge, MethodChip } from "@/components/payments/PaymentBits";
import { ReceiveMethodsDialog } from "@/components/payments/ReceiveMethodsDialog";
import { PAYMENT_METHODS, type PaymentClaim } from "@/lib/payments";

const toMillis = (value?: Timestamp | null) => value?.toMillis?.() ?? 0;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function ClaimLine({ claim, perspective }: { claim: PaymentClaim; perspective: "payee" | "payer" | "admin" }) {
  const created = claim.createdAt?.toDate?.();

  const title =
    claim.kind === "bill"
      ? `${claim.payerName} paid ${claim.billType} bill`
      : perspective === "payee"
        ? `${claim.payerName} sent you`
        : `To ${claim.payeeName}`;

  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium">
        {title} <span className="font-semibold">৳{claim.amount.toLocaleString("en-IN")}</span>
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <MethodChip method={claim.method} />
        {claim.trxId && <span className="font-mono">{claim.trxId}</span>}
        {claim.paidToLabel && <span>→ {claim.paidToLabel}</span>}
        <span>
          · {MONTHS[(claim.month || 1) - 1]} {claim.year}
          {created ? ` · ${format(created, "d MMM, h:mm a")}` : ""}
        </span>
        {claim.screenshotUrl && (
          <a
            href={claim.screenshotUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 underline"
          >
            Screenshot <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      {claim.note && <p className="mt-1 text-xs text-muted-foreground">“{claim.note}”</p>}
      {claim.status === "disputed" && claim.disputeReason && (
        <p className="mt-1 text-xs text-destructive">Reason: {claim.disputeReason}</p>
      )}
    </div>
  );
}

/*
 * Dashboard কার্ড:
 *  • কেউ আপনাকে টাকা পাঠালে → Confirm / Not received
 *  • অ্যাডমিন: অনলাইনে দেওয়া বিল যাচাই
 *  • আপনার নিজের পাঠানো পেমেন্টের অবস্থা
 *  • "My payment numbers" বাটন
 *
 * Confirm করলে একই batch-এ settlement রেকর্ড তৈরি হয়; Firestore rule
 * মিলিয়ে দেখে যে claim সত্যিই confirmed এবং আপনিই প্রাপক।
 */
export function PaymentsCard({
  groupId,
  currentUserId,
  currentUserName,
  isAdmin,
}: {
  groupId: string;
  currentUserId: string;
  currentUserName: string;
  isAdmin: boolean;
}) {
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [disputingId, setDisputingId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  const claimsCollection = useMemo(
    () => collection(firestore, "groups", groupId, "paymentClaims"),
    [groupId]
  );

  const toConfirmQuery = useMemo(
    () =>
      query(
        claimsCollection,
        where("payeeId", "==", currentUserId),
        where("status", "==", "pending")
      ),
    [claimsCollection, currentUserId]
  );

  const billsQuery = useMemo(
    () =>
      isAdmin
        ? query(claimsCollection, where("kind", "==", "bill"), where("status", "==", "pending"))
        : null,
    [claimsCollection, isAdmin]
  );

  const mineQuery = useMemo(
    () => query(claimsCollection, where("payerId", "==", currentUserId)),
    [claimsCollection, currentUserId]
  );

  const { data: toConfirm } = useCollection<PaymentClaim>(toConfirmQuery);
  const { data: pendingBills } = useCollection<PaymentClaim>(billsQuery);
  const { data: mine } = useCollection<PaymentClaim>(mineQuery);

  const sortedToConfirm = useMemo(
    () => [...(toConfirm ?? [])].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)),
    [toConfirm]
  );

  const sortedBills = useMemo(
    () =>
      [...(pendingBills ?? [])]
        .filter((claim) => claim.payerId !== currentUserId)
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)),
    [pendingBills, currentUserId]
  );

  const recentMine = useMemo(
    () => [...(mine ?? [])].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)).slice(0, 5),
    [mine]
  );

  const handleConfirm = async (claim: PaymentClaim) => {
    setBusyId(claim.id);

    try {
      const batch = writeBatch(firestore);
      const claimRef = doc(firestore, "groups", groupId, "paymentClaims", claim.id);

      batch.update(claimRef, {
        status: "confirmed",
        reviewedBy: currentUserId,
        reviewedByName: currentUserName.slice(0, 80) || "Member",
        reviewedAt: serverTimestamp(),
      });

      let settlementCreated = false;

      if (claim.kind === "settlement") {
        const settlementRef = doc(
          firestore,
          "groups",
          groupId,
          "settlements",
          `${claim.payerId}-${claim.month}-${claim.year}`
        );
        const existing = await getDoc(settlementRef);

        if (!existing.exists()) {
          batch.set(settlementRef, {
            groupId,
            userId: claim.payerId,
            month: claim.month,
            year: claim.year,
            settledAt: serverTimestamp(),
            settlementMethod: claim.trxId
              ? `${PAYMENT_METHODS[claim.method].label} · TrxID ${claim.trxId}`
              : PAYMENT_METHODS[claim.method].label,
            settledTo: claim.payeeName ?? currentUserName,
            settledToId: currentUserId,
            claimId: claim.id,
            amount: claim.amount,
            trxId: claim.trxId ?? null,
            confirmedBy: currentUserId,
          });
          settlementCreated = true;
        }
      }

      await batch.commit();

      toast({
        title: "Payment confirmed",
        description:
          claim.kind === "settlement"
            ? settlementCreated
              ? `${claim.payerName}'s balance is now settled.`
              : "Confirmed. This month was already marked settled."
            : `${claim.payerName}'s ${claim.billType} bill payment is verified.`,
      });
    } catch (error) {
      console.error("Confirm payment error:", error);
      toast({
        variant: "destructive",
        title: "Could not confirm",
        description: "Check that the latest Firestore rules are deployed.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDispute = async (claim: PaymentClaim) => {
    const reason = disputeReason.trim();
    if (reason.length < 3) {
      toast({ variant: "destructive", title: "Add a short reason (at least 3 letters)." });
      return;
    }

    setBusyId(claim.id);

    try {
      const batch = writeBatch(firestore);
      batch.update(doc(firestore, "groups", groupId, "paymentClaims", claim.id), {
        status: "disputed",
        reviewedBy: currentUserId,
        reviewedByName: currentUserName.slice(0, 80) || "Member",
        reviewedAt: serverTimestamp(),
        disputeReason: reason.slice(0, 200),
      });
      await batch.commit();

      setDisputingId(null);
      setDisputeReason("");
      toast({ title: "Marked as not received", description: `${claim.payerName} will see your reason.` });
    } catch (error) {
      console.error("Dispute payment error:", error);
      toast({ variant: "destructive", title: "Could not update" });
    } finally {
      setBusyId(null);
    }
  };

  const handleWithdraw = async (claim: PaymentClaim) => {
    setBusyId(claim.id);
    try {
      await deleteDoc(doc(firestore, "groups", groupId, "paymentClaims", claim.id));
      toast({ title: "Payment withdrawn", description: "You can submit it again with the correct details." });
    } catch (error) {
      console.error("Withdraw payment error:", error);
      toast({ variant: "destructive", title: "Could not withdraw" });
    } finally {
      setBusyId(null);
    }
  };

  const renderReviewActions = (claim: PaymentClaim) => {
    const isBusy = busyId === claim.id;

    if (disputingId === claim.id) {
      return (
        <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row">
          <Input
            autoFocus
            placeholder="Why? e.g. No money in my bKash"
            value={disputeReason}
            maxLength={200}
            onChange={(event) => setDisputeReason(event.target.value)}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isBusy}
              onClick={() => {
                void handleDispute(claim);
              }}
            >
              Submit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setDisputingId(null);
                setDisputeReason("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          disabled={isBusy}
          onClick={() => {
            void handleConfirm(claim);
          }}
        >
          {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {claim.kind === "bill" ? "Verify" : "Received"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={isBusy}
          onClick={() => {
            setDisputingId(claim.id);
            setDisputeReason("");
          }}
        >
          <X className="h-3.5 w-3.5" />
          {claim.kind === "bill" ? "Problem" : "Not received"}
        </Button>
      </div>
    );
  };

  const hasReviewItems = sortedToConfirm.length > 0 || sortedBills.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5" />
            Payments
          </CardTitle>
          <CardDescription>
            {hasReviewItems ? "Payments waiting for your confirmation." : "Online bill payments and settlements."}
          </CardDescription>
        </div>

        <ReceiveMethodsDialog groupId={groupId} userId={currentUserId} displayName={currentUserName} />
      </CardHeader>

      <CardContent className="space-y-5">
        {sortedToConfirm.length > 0 && (
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Did you receive this?
            </h4>
            {sortedToConfirm.map((claim) => (
              <div key={claim.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <ClaimLine claim={claim} perspective="payee" />
                {renderReviewActions(claim)}
              </div>
            ))}
          </section>
        )}

        {sortedBills.length > 0 && (
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Bill payments to verify (admin)
            </h4>
            {sortedBills.map((claim) => (
              <div key={claim.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <ClaimLine claim={claim} perspective="admin" />
                {renderReviewActions(claim)}
              </div>
            ))}
          </section>
        )}

        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your recent payments
          </h4>

          {recentMine.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing yet. Use “Pay online” when adding an Electricity or Wi-Fi
              bill, or “Pay &amp; Settle” in the monthly summary.
            </p>
          ) : (
            recentMine.map((claim) => (
              <div key={claim.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <ClaimLine claim={claim} perspective="payer" />
                <div className="flex shrink-0 items-center gap-2">
                  <ClaimStatusBadge status={claim.status} />
                  {claim.status !== "confirmed" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 px-2 text-xs"
                      disabled={busyId === claim.id}
                      onClick={() => {
                        void handleWithdraw(claim);
                      }}
                      title="Withdraw this payment record"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </section>
      </CardContent>
    </Card>
  );
}
