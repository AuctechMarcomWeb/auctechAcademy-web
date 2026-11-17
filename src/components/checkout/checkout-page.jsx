"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2, Lock, PlayCircle, Tag, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/shared/empty-state";
import { Spinner } from "@/components/shared/loading";
import { PaymentGatewayDialog } from "./payment-gateway-dialog";
import { useDb } from "@/store/db.store";
import { useAuth } from "@/store/auth.store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useCurrentUser } from "@/hooks/use-current-user";
import { computeBreakdown, loadRazorpay, paymentService } from "@/services/payment.service";
import { ApiError } from "@/services/api-client";
import { useServerConfig } from "@/services/sync.service";
import { formatINR } from "@/lib/format";
import { ADMIN_URL, ROUTES } from "@/lib/constants";

/*
 * RAZORPAY INTEGRATION NOTE
 * -------------------------
 * 1. Load https://checkout.razorpay.com/v1/checkout.js (next/script, strategy "lazyOnload").
 * 2. `paymentService.createOrder` must call POST /api/orders; the backend creates the
 *    Razorpay order with the secret key and returns { order, checkout }.
 * 3. Replace <PaymentGatewayDialog/> with `new window.Razorpay(checkout).open()`.
 * 4. Razorpay's `handler` receives razorpay_payment_id, razorpay_order_id and
 *    razorpay_signature → POST /api/orders/:id/verify. The backend validates the
 *    HMAC-SHA256 signature and creates the enrollment. The frontend only reads the result.
 * 5. `modal.ondismiss` maps to the "cancelled" state; webhook `payment.failed` to "failed".
 */

const billingSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().regex(/^\+?[0-9\s-]{10,15}$/, "Enter a valid phone number"),
  address: z.string().min(5, "Enter your billing address"),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Enter your state"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
  gstin: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Enter a valid GSTIN")
    .optional()
    .or(z.literal("")),
  paymentMethod: z.enum(["razorpay", "upi", "card", "netbanking"]),
});

const METHODS = [
  { value: "razorpay", label: "Razorpay (all methods)", hint: "UPI, cards, net banking, wallets" },
  { value: "upi", label: "UPI", hint: "Google Pay, PhonePe, BHIM" },
  { value: "card", label: "Credit / Debit card", hint: "Visa, Mastercard, RuPay" },
  { value: "netbanking", label: "Net banking", hint: "All major Indian banks" },
];

export function CheckoutPage({ courseId }) {
  const serverConfig = useServerConfig((st) => st.config);
  const router = useRouter();
  const hydrated = useHydrated();
  const userId = useAuth((s) => s.userId);
  const user = useCurrentUser();
  const course = useDb((s) => s.courses.find((c) => c.id === courseId));
  const instructor = useDb((s) => s.instructors.find((i) => i.id === course?.instructorId));
  const alreadyEnrolled = useDb((s) =>
    Boolean(userId && s.enrollments.some((e) => e.userId === userId && e.courseId === courseId && e.status !== "refunded")),
  );

  const [coupon, setCoupon] = useState();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [stage, setStage] = useState("form");
  const [order, setOrder] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);

  const { register, handleSubmit, setValue, watch, formState, reset } = useForm({
    resolver: zodResolver(billingSchema),
    defaultValues: { fullName: "", email: "", phone: "", address: "", city: "", state: "", pincode: "", gstin: "", paymentMethod: "razorpay" },
  });

  useEffect(() => {
    if (user) reset((v) => ({ ...v, fullName: user.name, email: user.email, phone: user.phone ?? "" }));
  }, [user, reset]);

  useEffect(() => {
    if (hydrated && !userId) router.replace(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.checkout(courseId))}`);
  }, [hydrated, userId, router, courseId]);

  if (!hydrated || !userId) return <Spinner label="Preparing checkout…" />;
  if (!course || course.status !== "published") {
    return (
      <div className="container-x py-16">
        <EmptyState
          title="Course unavailable"
          description="This course cannot be purchased right now."
          action={
            <Button asChild>
              <Link href={ROUTES.explore}>Browse courses</Link>
            </Button>
          }
        />
      </div>
    );
  }
  if (user?.role === "admin") {
    return (
      <div className="container-x py-16">
        <EmptyState
          title="Admins cannot purchase courses"
          description="Sign in with a student account to test checkout."
          action={
            <Button asChild variant="outline">
              <a href={`${ADMIN_URL}${ROUTES.admin.dashboard}`}>Go to admin</a>
            </Button>
          }
        />
      </div>
    );
  }

  const breakdown = computeBreakdown(course, coupon);

  const applyCoupon = async () => {
    setCouponError(null);
    setCouponBusy(true);
    try {
      const c = await paymentService.validateCoupon(couponInput, course);
      setCoupon(c);
      toast.success(`Coupon ${c.code} applied`);
    } catch (e) {
      setCouponError(e instanceof ApiError ? e.message : "Could not apply coupon.");
    } finally {
      setCouponBusy(false);
    }
  };

  const pay = async (values) => {
    setError(null);
    try {
      const res = await paymentService.createOrder({
        userId,
        course,
        coupon,
        billing: { ...values, gstin: values.gstin || undefined },
        paymentMethod: values.paymentMethod,
      });
      setOrder(res.order);
      setCheckout(res.checkout);
      if (res.enrollment || !res.checkout) {
        // Fully discounted order — the server enrolled the learner directly.
        setStage("successful");
        return;
      }
      setStage("pending");
      if (res.checkout.mode === "razorpay") await openRazorpay(res.order, res.checkout);
      else setGatewayOpen(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create the order.");
    }
  };

  /** Live mode: real Razorpay Checkout; the backend verifies the signature before enrolling. */
  const openRazorpay = async (o, opts) => {
    const ok = await loadRazorpay();
    if (!ok || !window.Razorpay) {
      setError("Could not load Razorpay Checkout. Check your connection and try again.");
      await paymentService.cancelOrder(o.id, "failed", "checkout_script_failed").catch(() => {});
      setStage("failed");
      return;
    }
    const { mode: _mode, ...options } = opts;
    void _mode;
    const rzp = new window.Razorpay({
      ...options,
      handler: async (resp) => {
        setVerifying(true);
        try {
          const res = await paymentService.verifyPayment(o.id, resp);
          setOrder(res.order);
          setStage(res.enrollment ? "successful" : res.order.status);
        } catch (e) {
          setError(e instanceof ApiError ? e.message : "Verification failed.");
          setStage("failed");
        } finally {
          setVerifying(false);
        }
      },
      modal: {
        ondismiss: async () => {
          const updated = await paymentService.cancelOrder(o.id, "cancelled").catch(() => null);
          if (updated) setOrder(updated);
          setStage((s) => (s === "pending" ? "cancelled" : s));
        },
      },
    });
    rzp.on("payment.failed", async (resp) => {
      const updated = await paymentService.cancelOrder(o.id, "failed", resp.error?.description).catch(() => null);
      if (updated) setOrder(updated);
      setError(resp.error?.description ?? "The payment failed.");
      setStage("failed");
    });
    rzp.open();
  };

  const onOutcome = async (outcome) => {
    if (!order) return;
    setVerifying(true);
    try {
      // The course is unlocked only if the (mock) backend confirms the payment and returns an enrollment.
      const res = await paymentService.verifyPayment(order.id, outcome);
      setOrder(res.order);
      setStage(res.enrollment ? "successful" : res.order.status);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Verification failed.");
      setStage("failed");
    } finally {
      setVerifying(false);
      setGatewayOpen(false);
    }
  };

  const retry = () => {
    setOrder(null);
    setCheckout(null);
    setStage("form");
  };

  if (alreadyEnrolled && stage !== "successful") {
    return (
      <div className="container-x py-16 max-w-xl">
        <Card className="p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h1 className="mt-4 text-2xl font-bold">You&apos;re already enrolled</h1>
          <p className="mt-2 text-muted-foreground">{course.title} is in your library. Pick up where you left off.</p>
          <Button asChild size="lg" className="mt-6">
            <Link href={ROUTES.student.learn(course.id)}>
              <PlayCircle /> Continue learning
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const statusPanel = () => {
    switch (stage) {
      case "pending":
        return (
          <Card className="p-8 text-center" data-testid="checkout-status" data-status="pending">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-secondary" />
            <h2 className="mt-4 text-xl font-semibold">Waiting for payment confirmation…</h2>
            <p className="mt-1 text-sm text-muted-foreground">Order {order?.orderNumber}. Do not close this window.</p>
          </Card>
        );
      case "successful":
        return (
          <Card className="p-8 text-center" data-testid="checkout-status" data-status="successful">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h2 className="mt-4 text-2xl font-bold">Payment successful</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Order {order?.orderNumber} · {formatINR(order?.total ?? 0)} · You now have lifetime access to{" "}
              <span className="font-medium text-foreground">{course.title}</span>.
            </p>
            <Badge variant="warning" className="mt-3">
              Demo transaction — not a real payment
            </Badge>
            <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild size="lg" variant="accent">
                <Link href={ROUTES.student.learn(course.id)}>
                  <PlayCircle /> Start learning
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={ROUTES.student.payments}>View receipt</Link>
              </Button>
            </div>
          </Card>
        );
      case "failed":
        return (
          <Card className="p-8 text-center" data-testid="checkout-status" data-status="failed">
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-2xl font-bold">Payment failed</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {error ?? "Your bank or payment provider declined the transaction. No amount has been charged."}
            </p>
            <div className="mt-6 flex gap-2 justify-center">
              <Button onClick={retry}>Try again</Button>
              <Button asChild variant="outline">
                <Link href={ROUTES.contact}>Contact support</Link>
              </Button>
            </div>
          </Card>
        );
      case "cancelled":
        return (
          <Card className="p-8 text-center" data-testid="checkout-status" data-status="cancelled">
            <X className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-bold">Payment cancelled</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You closed the payment window before completing the transaction. Nothing was charged.
            </p>
            <div className="mt-6 flex gap-2 justify-center">
              <Button onClick={retry}>Return to checkout</Button>
              <Button asChild variant="outline">
                <Link href={ROUTES.course(course.slug)}>Back to course</Link>
              </Button>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  const summary = (
    <Card className="p-5 space-y-4">
      <h2 className="font-semibold">Order summary</h2>
      <div className="flex gap-3">
        <div className="relative h-16 w-28 shrink-0 rounded-md overflow-hidden">
          <Image src={course.thumbnail} alt="" fill className="object-cover" sizes="112px" />
        </div>
        <div className="min-w-0">
          <p className="font-medium leading-snug line-clamp-2">{course.title}</p>
          <p className="text-xs text-muted-foreground">
            {instructor?.name} · {course.level}
          </p>
        </div>
      </div>
      <Separator />
      {stage === "form" && (
        <div>
          <label htmlFor="coupon" className="text-sm font-medium flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5" /> Coupon code
          </label>
          {coupon ? (
            <div className="mt-2 flex items-center justify-between rounded-md border border-success/30 bg-success/5 px-3 py-2 text-sm">
              <span>
                <span className="font-mono font-semibold">{coupon.code}</span> · {coupon.description}
              </span>
              <button
                className="text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Remove coupon"
                onClick={() => {
                  setCoupon(undefined);
                  setCouponInput("");
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="mt-2 flex gap-2">
              <Input
                id="coupon"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="AUCTECH20"
                className="font-mono uppercase"
              />
              <Button type="button" variant="outline" onClick={applyCoupon} loading={couponBusy} disabled={!couponInput.trim()}>
                Apply
              </Button>
            </div>
          )}
          {couponError && <p className="mt-1 text-xs text-destructive">{couponError}</p>}
          {!coupon && !couponError && serverConfig?.demoReset && (
            <p className="mt-1 text-xs text-muted-foreground">Test codes: AUCTECH20 or WELCOME500.</p>
          )}
        </div>
      )}
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Course price</dt>
          <dd>{formatINR(breakdown.subtotal)}</dd>
        </div>
        {course.originalPrice > course.price && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <dt>List price</dt>
            <dd className="line-through">{formatINR(course.originalPrice)}</dd>
          </div>
        )}
        {breakdown.discount > 0 && (
          <div className="flex justify-between text-success">
            <dt>Coupon discount</dt>
            <dd>− {formatINR(breakdown.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">GST (18%)</dt>
          <dd>{formatINR(breakdown.tax)}</dd>
        </div>
        <Separator />
        <div className="flex justify-between text-base font-bold">
          <dt>Total payable</dt>
          <dd>{formatINR(breakdown.total)}</dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Lock className="h-3 w-3" /> Secured by Razorpay. 7-day refund policy applies.
      </p>
    </Card>
  );

  return (
    <div className="container-x py-8 lg:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          {stage === "form" ? (
            <form onSubmit={handleSubmit(pay)} className="space-y-6" noValidate>
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
                </div>
              )}
              <Card className="p-5 sm:p-6">
                <h2 className="font-semibold mb-4">Billing details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Full name" htmlFor="fullName" error={formState.errors.fullName?.message} required>
                    <Input id="fullName" {...register("fullName")} />
                  </FormField>
                  <FormField label="Email" htmlFor="email" error={formState.errors.email?.message} required>
                    <Input id="email" type="email" {...register("email")} />
                  </FormField>
                  <FormField label="Phone" htmlFor="phone" error={formState.errors.phone?.message} required>
                    <Input id="phone" type="tel" {...register("phone")} />
                  </FormField>
                  <FormField label="GSTIN (optional)" htmlFor="gstin" error={formState.errors.gstin?.message} hint="For business invoices">
                    <Input id="gstin" className="uppercase" {...register("gstin")} />
                  </FormField>
                  <FormField label="Address" htmlFor="address" error={formState.errors.address?.message} required className="sm:col-span-2">
                    <Input id="address" {...register("address")} />
                  </FormField>
                  <FormField label="City" htmlFor="city" error={formState.errors.city?.message} required>
                    <Input id="city" {...register("city")} />
                  </FormField>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="State" htmlFor="state" error={formState.errors.state?.message} required>
                      <Input id="state" {...register("state")} />
                    </FormField>
                    <FormField label="PIN code" htmlFor="pincode" error={formState.errors.pincode?.message} required>
                      <Input id="pincode" inputMode="numeric" {...register("pincode")} />
                    </FormField>
                  </div>
                </div>
              </Card>
              <Card className="p-5 sm:p-6">
                <h2 className="font-semibold mb-4">Payment method</h2>
                <RadioGroup value={watch("paymentMethod")} onValueChange={(v) => setValue("paymentMethod", v)} className="gap-2">
                  {METHODS.map((m) => (
                    <label
                      key={m.value}
                      className="flex items-center gap-3 rounded-md border border-border p-3 cursor-pointer has-[[data-state=checked]]:border-secondary has-[[data-state=checked]]:bg-secondary/5"
                    >
                      <RadioGroupItem value={m.value} />
                      <span className="flex-1">
                        <span className="block text-sm font-medium">{m.label}</span>
                        <span className="block text-xs text-muted-foreground">{m.hint}</span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </Card>
              <div className="lg:hidden">{summary}</div>
              <Button data-testid="checkout-pay" type="submit" size="xl" className="w-full" variant="accent" loading={formState.isSubmitting}>
                <Lock /> Pay {formatINR(breakdown.total)}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                By paying you agree to the{" "}
                <Link href="/terms" className="underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/refund-policy" className="underline">
                  Refund Policy
                </Link>
                .
              </p>
            </form>
          ) : (
            <div className="space-y-6">
              {statusPanel()}
              <div className="lg:hidden">{summary}</div>
            </div>
          )}
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-24">{summary}</div>
        </aside>
      </div>
      <PaymentGatewayDialog open={gatewayOpen} options={checkout} busy={verifying} onOutcome={onOutcome} />
    </div>
  );
}
