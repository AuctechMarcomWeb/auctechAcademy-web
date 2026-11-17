"use client";

import { FlaskConical, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatINR } from "@/lib/format";

/**
 * Stand-in for the Razorpay Checkout modal.
 *
 * In production this component is replaced by:
 *   const rzp = new window.Razorpay({ ...options, handler: (res) => verify(res) , modal: { ondismiss: () => cancel() } });
 *   rzp.open();
 * where `verify` posts razorpay_payment_id / razorpay_order_id / razorpay_signature to the backend.
 * The demo never claims a real transaction took place.
 */
export function PaymentGatewayDialog({ open, options, busy, onOutcome }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onOutcome("cancelled")}>
      <DialogContent size="sm" hideClose>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-secondary" /> Demo payment gateway
          </DialogTitle>
          <DialogDescription>This dialog simulates Razorpay Checkout. No money moves and no real payment is recorded.</DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 flex items-start gap-2">
          <FlaskConical className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          Simulation only. Choose an outcome to exercise the frontend states.
        </div>
        {options && (
          <dl className="rounded-md bg-muted p-3 text-xs font-mono space-y-1">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">key</dt>
              <dd className="truncate">{options.key}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">order_id</dt>
              <dd className="truncate">{options.order_id}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">amount</dt>
              <dd>
                {options.amount} paise ({formatINR(options.amount / 100)})
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">currency</dt>
              <dd>{options.currency}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">prefill.email</dt>
              <dd className="truncate">{options.prefill.email}</dd>
            </div>
          </dl>
        )}
        <div className="grid gap-2">
          <Button data-testid="gateway-success" variant="success" onClick={() => onOutcome("successful")} loading={busy}>
            Simulate success
          </Button>
          <Button data-testid="gateway-failure" variant="destructive" onClick={() => onOutcome("failed")} disabled={busy}>
            Simulate failure
          </Button>
          <Button data-testid="gateway-cancel" variant="outline" onClick={() => onOutcome("cancelled")} disabled={busy}>
            Cancel payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
