"use client";

import { useState } from "react";
import { Check, Copy, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  PAYMENT_METHODS,
  type PaymentClaimStatus,
  type PaymentMethodType,
  ussdHref,
} from "@/lib/payments";

/*
 * ছোট ছোট UI টুকরো যেগুলো Pay Bill, Settle Up আর
 * Payments কার্ড — তিন জায়গাতেই লাগে।
 */

export function CopyRow({
  label,
  value,
  display,
  mono = true,
}: {
  label: string;
  value: string;
  /* স্ক্রিনে অন্যভাবে দেখাতে চাইলে (যেমন ৳ চিহ্ন সহ); কপি হবে value। */
  display?: string;
  mono?: boolean;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
      toast({ title: "Copied", description: `${label} copied.` });
    } catch {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Long-press the text to copy it manually.",
      });
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "select-all break-all text-sm font-semibold",
            mono && "font-mono tracking-wide"
          )}
        >
          {display ?? value}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5"
        onClick={() => {
          void handleCopy();
        }}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

export function MethodChip({
  method,
  className,
}: {
  method: PaymentMethodType;
  className?: string;
}) {
  const info = PAYMENT_METHODS[method];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        info.chipClass,
        className
      )}
    >
      {info.label}
    </span>
  );
}

export function MethodPicker({
  options,
  value,
  onChange,
  disabled,
}: {
  options: PaymentMethodType[];
  value: PaymentMethodType | null;
  onChange: (method: PaymentMethodType) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((method) => {
        const info = PAYMENT_METHODS[method];
        const isActive = value === method;

        return (
          <button
            key={method}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={disabled}
            onClick={() => onChange(method)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
              isActive
                ? info.chipClass + " ring-2 ring-offset-1 ring-offset-background ring-current"
                : "border-input bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            {info.label}
          </button>
        );
      })}
    </div>
  );
}

export function StepsList({ steps }: { steps: string[] }) {
  if (steps.length === 0) return null;

  return (
    <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );
}

/*
 * মোবাইলে USSD ডায়ালার খুলে দেয় (অ্যাপ না থাকলে বা নেট না থাকলে কাজে লাগে)।
 * ডেস্কটপে এটা কিছু করবে না, তাই ছোট করে রাখা।
 */
export function UssdButton({ method }: { method: PaymentMethodType }) {
  const info = PAYMENT_METHODS[method];
  const href = ussdHref(info.ussd);

  if (!href) return null;

  return (
    <Button
      asChild
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 gap-1.5 px-2 text-xs"
    >
      <a href={href}>
        <Phone className="h-3.5 w-3.5" />
        Dial {info.ussd}
      </a>
    </Button>
  );
}

export function ClaimStatusBadge({
  status,
}: {
  status: PaymentClaimStatus;
}) {
  if (status === "confirmed") {
    return (
      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-300">
        Confirmed
      </Badge>
    );
  }

  if (status === "disputed") {
    return <Badge variant="destructive">Not received</Badge>;
  }

  return <Badge variant="secondary">Pending</Badge>;
}
