import Link from "next/link";
import { CheckCircle2, FileQuestion, SearchX, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DemoTag } from "@/components/shared/demo-banner";
import { formatDate, formatDateTime } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const TONE = {
  valid: { icon: CheckCircle2, color: "text-success", bg: "bg-success/5 border-success/30", title: "Certificate is valid" },
  revoked: { icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/5 border-destructive/30", title: "Certificate has been revoked" },
  invalid: { icon: FileQuestion, color: "text-amber-700", bg: "bg-amber-50 border-amber-200", title: "Invalid certificate ID" },
  not_found: { icon: SearchX, color: "text-muted-foreground", bg: "bg-muted border-border", title: "No certificate found" },
};

export function VerificationResultCard({ result }) {
  const t = TONE[result.status];
  const Icon = t.icon;
  return (
    <Card data-testid="verify-result" data-status={result.status} className={cn("p-6 sm:p-8 border", t.bg)}>
      <div className="flex items-start gap-4">
        <Icon className={cn("h-10 w-10 shrink-0", t.color)} />
        <div className="min-w-0 flex-1">
          <h2 className={cn("text-xl font-bold", t.color)}>{t.title}</h2>
          {result.status === "valid" || result.status === "revoked" ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.status === "valid"
                  ? "This certificate was issued by Auctech Academy and matches our records."
                  : "This certificate was issued but is no longer recognised by Auctech Academy."}
              </p>
              {result.status === "revoked" && result.certificate.revokedReason && (
                <p className="mt-2 rounded-md bg-white/70 p-3 text-sm">
                  <span className="font-semibold">Reason:</span> {result.certificate.revokedReason}{" "}
                  {result.certificate.revokedAt && <span className="text-muted-foreground">({formatDateTime(result.certificate.revokedAt)})</span>}
                </p>
              )}
              <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Certificate ID</dt>
                  <dd className="font-mono font-semibold">{result.certificate.id}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Holder</dt>
                  <dd className="font-semibold">{result.certificate.studentName}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {result.certificate.kind === "internship" ? "Internship" : "Course"}
                  </dt>
                  <dd className="font-semibold">{result.certificate.courseTitle}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Completed</dt>
                  <dd>{formatDate(result.certificate.completedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Issued</dt>
                  <dd>{formatDate(result.certificate.issuedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Final score</dt>
                  <dd>{result.certificate.finalScore}%</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Status</dt>
                  <dd className={cn("font-semibold capitalize", t.color)}>{result.status}</dd>
                </div>
              </dl>
              <div className="mt-4">
                <DemoTag />
              </div>
            </>
          ) : result.status === "invalid" ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {result.reason} You entered: <span className="font-mono">{result.certificateId || "—"}</span>
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                No certificate with ID <span className="font-mono font-semibold text-foreground">{result.certificateId}</span> exists in our registry.
                Check the ID for typos or ask the holder to share the QR code from their certificate.
              </p>
              <Button asChild variant="link" className="px-0 mt-2">
                <Link href={ROUTES.contact}>Report a suspected forgery</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
