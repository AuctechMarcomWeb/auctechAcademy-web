import { LegalPage } from "@/components/static/legal-page";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This policy explains what personal data Auctech Academy collects, why we collect it, and the choices you have. It applies to certify.auctech.in and related services."
      sections={[
        {
          title: "Data we collect",
          body: [
            "Account data: name, email address, phone number and password hash. Learning data: lessons watched, playback positions, quiz attempts, assignment submissions and certificates. Payment data: order amounts, invoices and the payment reference returned by Razorpay. We never store card numbers.",
            "Technical data: IP address, device and browser type, and usage analytics collected through cookies.",
          ],
        },
        {
          title: "How we use it",
          body: [
            "To deliver courses and track your progress, to issue and verify certificates, to process payments and refunds, to respond to support requests and to improve the platform. Aggregated, anonymised analytics may be used in reports.",
          ],
        },
        {
          title: "Certificate verification",
          body: [
            "When a certificate is verified, the verification page shows the holder's name, the course title, completion and issue dates, final score and status. By accepting a certificate you consent to this information being visible to anyone who holds the certificate ID or QR code.",
          ],
        },
        {
          title: "Sharing",
          body: [
            "We share data with service providers who process it on our behalf — payment gateway, email delivery, video hosting and analytics — under contracts that restrict their use of it. We do not sell personal data. Internship applications are shared with the hosting department and assigned mentor.",
          ],
        },
        {
          title: "Retention",
          body: [
            "Account and learning data are retained while your account is active and for 24 months after the last login. Certificate records are retained indefinitely so verification continues to work. Financial records are kept for the period required by Indian tax law.",
          ],
        },
        {
          title: "Your rights",
          body: [
            "You can access, correct or export your data from your profile and settings pages, or by emailing academy@auctech.in. You may request deletion of your account; certificate records are anonymised rather than deleted.",
          ],
        },
        { title: "Contact", body: ["Questions about this policy can be sent to academy@auctech.in or to the postal address on the Contact page."] },
      ]}
    />
  );
}
