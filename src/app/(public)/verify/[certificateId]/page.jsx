import { VerifyForm } from "@/components/verify/verify-form";
import { PageHeader } from "@/components/shared/page-header";
import { normalizeCertificateId } from "@/services/certificate.service";

export async function generateMetadata({ params }) {
  const { certificateId } = await params;
  const id = normalizeCertificateId(decodeURIComponent(certificateId));
  return { title: `Verify ${id}`, description: `Verification result for Auctech Academy certificate ${id}.`, robots: { index: false } };
}

export default async function VerifyCertificatePage({ params }) {
  const { certificateId } = await params;
  const id = normalizeCertificateId(decodeURIComponent(certificateId));
  return (
    <div className="container-x py-8 lg:py-12 max-w-3xl">
      <PageHeader
        eyebrow="Certificate verification"
        title="Verification result"
        description={
          <>
            Checking certificate <span className="font-mono font-semibold text-foreground">{id}</span>.
          </>
        }
        className="mb-8"
      />
      <VerifyForm initialId={id} key={id} />
    </div>
  );
}
