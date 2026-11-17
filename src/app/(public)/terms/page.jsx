import { LegalPage } from "@/components/static/legal-page";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="These terms govern your use of Auctech Academy. By creating an account or purchasing a course you agree to them."
      sections={[
        {
          title: "Accounts",
          body: [
            "You must be at least 16 years old to register. You are responsible for keeping your credentials secure and for all activity under your account. One person may hold one account.",
          ],
        },
        {
          title: "Course access and licence",
          body: [
            "A purchase grants you a personal, non-transferable licence to access the course content for as long as the course remains published. Content may not be downloaded (except resources marked downloadable), copied, shared or resold.",
          ],
        },
        {
          title: "Sequential learning and assessments",
          body: [
            "Lessons unlock in order. Attempting to bypass playback tracking, sharing quiz answers, submitting work that is not your own or using another person to complete assessments is a breach of these terms and may result in revocation of certificates and closure of your account.",
          ],
        },
        {
          title: "Certificates",
          body: [
            "Certificates are issued only when all completion requirements are met and are subject to audit. Auctech may revoke a certificate for academic-integrity breaches; the verification page will show the revocation and reason. Certificates confirm course completion and are not accredited academic qualifications.",
          ],
        },
        {
          title: "Internships",
          body: [
            "Internship listings describe the role, duration, work mode and stipend. Applying does not guarantee selection. Internship agreements, if offered, are separate from these terms.",
          ],
        },
        {
          title: "Payments",
          body: [
            "Prices are in Indian Rupees and exclude GST unless stated. Payments are processed by Razorpay; Auctech does not store card details. Refunds are governed by the Refund Policy.",
          ],
        },
        {
          title: "Limitation of liability",
          body: [
            "The platform is provided as is. To the extent permitted by law, Auctech is not liable for indirect or consequential losses arising from use of the platform. Our total liability is limited to the amount you paid for the affected course.",
          ],
        },
        {
          title: "Changes and governing law",
          body: [
            "We may update these terms; material changes will be announced on the platform. These terms are governed by the laws of India, with courts in Hyderabad, Telangana having jurisdiction.",
          ],
        },
      ]}
    />
  );
}
