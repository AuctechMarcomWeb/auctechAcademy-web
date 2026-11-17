import { LegalPage } from "@/components/static/legal-page";

export const metadata = { title: "Refund Policy" };

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      intro="We want you to be confident in every purchase. This policy sets out when a refund is available and how to request one."
      sections={[
        {
          title: "7-day refund window",
          body: [
            "You may request a full refund within 7 days of purchase if you have completed less than 20% of the course (measured by completed lessons and quizzes). Requests outside this window or beyond this threshold are not eligible, except as described below.",
          ],
        },
        {
          title: "Exceptions",
          body: [
            "Courses that were withdrawn or materially changed by Auctech after your purchase are refundable at any time. Duplicate payments are refunded in full automatically once confirmed by the payment gateway.",
          ],
        },
        {
          title: "Non-refundable items",
          body: [
            "Courses for which a certificate has already been issued. Bundles where any course in the bundle exceeds the 20% threshold. Internship-related fees, where applicable.",
          ],
        },
        {
          title: "How to request",
          body: [
            "Email academy@auctech.in from your registered address with your order number (format AUC-ORD-00000). We acknowledge within 2 working days and process approved refunds within 7 working days to the original payment method via Razorpay. Bank processing may add 5–7 days.",
          ],
        },
        {
          title: "Effect of a refund",
          body: [
            "Course access is removed when the refund is approved. Progress, notes and quiz attempts for that course are deleted after 30 days.",
          ],
        },
      ]}
    />
  );
}
