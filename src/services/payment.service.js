import { GST_RATE } from "@/lib/constants";
import { useDb } from "@/store/db.store";
import { api } from "./api-client";
import { syncService } from "./sync.service";

/** Display-only estimate; the server recomputes the amount that is charged. */
export function computeBreakdown(course, coupon) {
  const gst = (useDb.getState().settings.gstPercent ?? GST_RATE * 100) / 100;
  const subtotal = course.price;
  let discount = 0;
  if (coupon?.active) {
    if (coupon.minAmount && subtotal < coupon.minAmount) discount = 0;
    else if (coupon.type === "percent") discount = Math.round((subtotal * coupon.value) / 100);
    else discount = Math.min(coupon.value, subtotal);
  }
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * gst);
  return { subtotal, discount, taxable, tax, total: taxable + tax, coupon };
}

async function applyEnrollment(order, enrollment) {
  const db = useDb.getState();
  db.addOrder(order);
  if (enrollment) {
    db.addEnrollment(enrollment);
    // Reload so the newly bought course arrives with its lesson videos (hidden until purchase).
    await syncService.load();
  }
}

export const paymentService = {
  async validateCoupon(code, course) {
    const { coupon } = await api.post("/payments/coupons/validate", { code: code.trim(), courseId: course.id });
    return coupon;
  },

  /** Step 1 — create the order on the server. Free orders come back already enrolled. */
  async createOrder(params) {
    const res = await api.post("/payments/orders", {
      courseId: params.course.id,
      couponCode: params.coupon?.code,
      billing: params.billing,
      paymentMethod: params.paymentMethod,
    });
    await applyEnrollment(res.order, res.enrollment);
    return res;
  },

  /**
   * Step 4 — verify with the backend. Pass the Razorpay success payload in
   * live mode, or a simulated outcome in demo mode.
   */
  async verifyPayment(orderId, result) {
    const body = typeof result === "string" ? { outcome: result } : result;
    const res = await api.post(`/payments/orders/${encodeURIComponent(orderId)}/verify`, body);
    await applyEnrollment(res.order, res.enrollment);
    return res;
  },

  async cancelOrder(orderId, status = "cancelled", reason) {
    const { order } = await api.post(`/payments/orders/${encodeURIComponent(orderId)}/cancel`, { status, reason });
    useDb.getState().addOrder(order);
    return order;
  },

  async ordersFor(userId) {
    void userId;
    return api.get("/me/orders");
  },

  /* Admin */
  async refund(orderId) {
    const { order, enrollment } = await api.post(`/admin/orders/${encodeURIComponent(orderId)}/refund`);
    const db = useDb.getState();
    db.addOrder(order);
    if (enrollment) db.addEnrollment(enrollment);
  },
};

export function loadRazorpay() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}
