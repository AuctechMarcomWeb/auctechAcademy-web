import { CheckoutPage } from "@/components/checkout/checkout-page";

export const metadata = { title: "Checkout", robots: { index: false } };

export default async function Checkout({ params }) {
  const { courseId } = await params;
  return <CheckoutPage courseId={courseId} />;
}
