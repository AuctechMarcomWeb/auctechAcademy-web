import { VerifyForm } from "@/components/verify/verify-form";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = {
  title: "Verify a Certificate",
  description: "Confirm the authenticity of an Auctech Academy certificate using its unique ID or QR code.",
};

export default function VerifyPage() {
  return (
    <div className="container-x py-8 lg:py-12 max-w-3xl">
      <PageHeader
        eyebrow="Certificate verification"
        title="Verify a certificate"
        description="Enter the certificate ID printed on the document, or scan its QR code. Every Auctech certificate resolves to this page."
        className="mb-8"
      />
      <VerifyForm />
      <section className="mt-12 grid gap-4 sm:grid-cols-3 text-sm">
        {[
          ["1. Find the ID", "It's printed under the holder's name, e.g. AUC-DM-2026-000124."],
          ["2. Verify", "We check it against the live registry and show the holder, course and dates."],
          ["3. Check status", "Valid certificates are green. Revoked ones show the reason for revocation."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl border border-border bg-card p-4">
            <p className="font-semibold">{t}</p>
            <p className="mt-1 text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
