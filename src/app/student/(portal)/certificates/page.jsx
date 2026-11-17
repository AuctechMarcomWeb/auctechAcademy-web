"use client";

import * as React from "react";
import Link from "next/link";
import { Award, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading";
import { StatusBadge } from "@/components/shared/status-badge";
import { DemoTag } from "@/components/shared/demo-banner";
import { CertificateActions, CertificatePreview } from "@/components/certificate/certificate-preview";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { useDb } from "@/store/db.store";
import { formatDate } from "@/lib/format";
import { ROUTES } from "@/lib/constants";

export default function CertificatesPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const certificates = useDb((s) => s.certificates);
  const [printing, setPrinting] = React.useState(null);

  React.useEffect(() => {
    if (!printing) return;
    const t = setTimeout(() => {
      window.print();
      setPrinting(null);
    }, 300);
    return () => clearTimeout(t);
  }, [printing]);

  if (!hydrated || !user) return <PageSkeleton />;
  const mine = certificates.filter((c) => c.userId === user.id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificates"
        description="Assessment-based certificates with a unique ID and QR code that anyone can verify."
        actions={<DemoTag />}
      />
      {mine.length ? (
        <div className="space-y-6">
          {mine.map((cert) => (
            <Card key={cert.id} className="overflow-hidden">
              <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <div className="rounded-lg border border-border shadow-card overflow-hidden">
                  <CertificatePreview certificate={cert} />
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                        {cert.kind === "internship" ? "Internship certificate" : "Course certificate"}
                      </p>
                      <h3 className="text-lg font-semibold leading-snug">{cert.courseTitle}</h3>
                    </div>
                    <StatusBadge status={cert.status} />
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Student</dt>
                      <dd className="font-medium">{cert.studentName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Final score</dt>
                      <dd className="font-medium">{cert.finalScore}%</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Completed</dt>
                      <dd className="font-medium">{formatDate(cert.completedAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Issued</dt>
                      <dd className="font-medium">{formatDate(cert.issuedAt)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">Certificate ID</dt>
                      <dd className="font-mono font-medium">{cert.id}</dd>
                    </div>
                  </dl>
                  {cert.status === "revoked" && (
                    <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      Revoked on {formatDate(cert.revokedAt)}: {cert.revokedReason}
                    </p>
                  )}
                  <CertificateActions certificate={cert} onPrint={() => setPrinting(cert)} />
                  <Button asChild variant="link" className="justify-start px-0">
                    <Link href={ROUTES.verifyCertificate(cert.id)}>
                      <ShieldCheck /> Open public verification page
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Complete every lesson, quiz and assignment in a course to earn your first certificate."
          action={
            <Button asChild>
              <Link href={ROUTES.student.myCourses}>Go to my courses</Link>
            </Button>
          }
        />
      )}

      {/* Print-only full-size render */}
      <Dialog open={Boolean(printing)} onOpenChange={(o) => !o && setPrinting(null)}>
        <DialogContent size="xl" hideClose className="p-0 bg-transparent border-0 shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Printing certificate</DialogTitle>
            <DialogDescription>Preparing the certificate for printing</DialogDescription>
          </DialogHeader>
          {printing && <CertificatePreview certificate={printing} printable />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
