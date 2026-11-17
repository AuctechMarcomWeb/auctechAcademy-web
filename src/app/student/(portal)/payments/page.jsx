"use client";

import * as React from "react";
import Link from "next/link";
import { CreditCard, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading";
import { StatusBadge } from "@/components/shared/status-badge";
import { DemoTag } from "@/components/shared/demo-banner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { useDb } from "@/store/db.store";
import { formatDateTime, formatINR } from "@/lib/format";
import { ROUTES } from "@/lib/constants";

const METHOD = { razorpay: "Razorpay", upi: "UPI", card: "Card", netbanking: "Net banking" };

export default function PaymentsPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const orders = useDb((s) => s.orders);
  const courses = useDb((s) => s.courses);
  const [selected, setSelected] = React.useState(null);
  if (!hydrated || !user) return <PageSkeleton />;

  const mine = orders.filter((o) => o.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const courseTitle = (id) => courses.find((c) => c.id === id)?.title ?? id;
  const total = mine.filter((o) => o.status === "successful").reduce((a, o) => a + o.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Payment History" description={`Total paid: ${formatINR(total)} · prices include 18% GST`} actions={<DemoTag />} />
      {mine.length ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mine.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.orderNumber}</TableCell>
                  <TableCell className="font-medium max-w-[240px] truncate">{courseTitle(o.courseId)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDateTime(o.createdAt)}</TableCell>
                  <TableCell>{METHOD[o.paymentMethod]}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatINR(o.total)}</TableCell>
                  <TableCell>
                    <StatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setSelected(o)} aria-label={`View invoice ${o.orderNumber}`}>
                      <Receipt /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={CreditCard}
          title="No payments yet"
          description="Your orders and invoices will appear here after your first purchase."
          action={
            <Button asChild>
              <Link href={ROUTES.explore}>Explore courses</Link>
            </Button>
          }
        />
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Invoice {selected.orderNumber}</DialogTitle>
                <DialogDescription>
                  {formatDateTime(selected.createdAt)} · {METHOD[selected.paymentMethod]}
                </DialogDescription>
              </DialogHeader>
              <div className="text-sm space-y-3">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Billed to</span>
                  <span className="font-medium text-right">
                    {user.name}
                    <br />
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>{courseTitle(selected.courseId)}</span>
                  <span className="tabular-nums">{formatINR(selected.subtotal)}</span>
                </div>
                {selected.discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount {selected.couponCode && `(${selected.couponCode})`}</span>
                    <span className="tabular-nums">− {formatINR(selected.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>GST (18%)</span>
                  <span className="tabular-nums">{formatINR(selected.tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span className="tabular-nums">{formatINR(selected.total)}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={selected.status} />
                </div>
                {selected.gatewayPaymentId && (
                  <p className="text-xs text-muted-foreground">
                    Gateway payment ID: <span className="font-mono">{selected.gatewayPaymentId}</span>
                  </p>
                )}
                {selected.gatewayOrderId && (
                  <p className="text-xs text-muted-foreground">
                    Gateway order ID: <span className="font-mono">{selected.gatewayOrderId}</span>
                  </p>
                )}
              </div>
              <Button variant="outline" onClick={() => window.print()} className="w-full">
                <Receipt /> Print invoice
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
