"use client";

import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { Download, Share2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { certificateUrl } from "@/services/certificate.service";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useServerConfig } from "@/services/sync.service";

/**
 * Landscape certificate layout. Sized with container units so it scales
 * cleanly inside cards; at full width it is A4-landscape proportioned.
 */
export function CertificatePreview({ certificate, className, printable }) {
  const testMode = Boolean(useServerConfig((st) => st.config?.demoReset));
  const url = certificateUrl(certificate.id);
  const revoked = certificate.status === "revoked";
  return (
    <div
      className={cn(
        "relative w-full aspect-[1.414/1] overflow-hidden bg-white text-primary select-none @container",
        printable && "print-area",
        className,
      )}
      role="img"
      aria-label={`Certificate of completion for ${certificate.studentName}, ${certificate.courseTitle}`}
    >
      {/* Frame */}
      <div className="absolute inset-[2.5%] border-[0.5cqw] border-primary" />
      <div className="absolute inset-[4%] border-[0.15cqw] border-accent" />
      <div className="absolute left-0 top-0 h-full w-[1.2%] bg-primary" />
      <div className="absolute right-0 top-0 h-full w-[1.2%] bg-accent" />

      {/* Test-environment ribbon (only while the backend allows demo resets — never in production) */}
      {testMode && (
        <div className="absolute -right-[12%] top-[8%] rotate-45 bg-amber-400 text-amber-950 text-[1.4cqw] font-bold tracking-widest uppercase px-[12%] py-[0.6%] shadow">
          Test environment
        </div>
      )}
      {revoked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <span className="rotate-[-20deg] border-[0.6cqw] border-destructive text-destructive text-[7cqw] font-black uppercase tracking-widest px-[3%] opacity-70">
            Revoked
          </span>
        </div>
      )}

      <div className="absolute inset-[8%] flex flex-col items-center text-center">
        <div className="flex items-center gap-[1.5cqw]">
          <Image src="/auctech-logo.png" alt="Auctech" width={120} height={100} className="w-[6cqw] h-auto" />
          <div className="text-left leading-none">
            <p className="text-[2.6cqw] font-bold tracking-tight">Auctech</p>
            <p className="text-[1.1cqw] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Academy</p>
          </div>
        </div>

        <p className="mt-[4%] text-[1.3cqw] font-semibold uppercase tracking-[0.35em] text-secondary">Certificate of Completion</p>
        <p className="mt-[2.5%] text-[1.4cqw] text-muted-foreground">This is to certify that</p>
        <p className="mt-[1%] text-[4.6cqw] font-bold leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          {certificate.studentName}
        </p>
        <p className="mt-[1.5%] text-[1.4cqw] text-muted-foreground max-w-[80%]">
          has successfully completed all lessons, assessments and requirements of the{" "}
          {certificate.kind === "internship" ? "internship programme" : "course"}
        </p>
        <p className="mt-[1%] text-[2.6cqw] font-semibold text-primary">{certificate.courseTitle}</p>
        <p className="mt-[1%] text-[1.3cqw] text-muted-foreground">
          with a final score of <span className="font-semibold text-foreground">{certificate.finalScore}%</span> · completed on{" "}
          {formatDate(certificate.completedAt, "d MMMM yyyy")}
        </p>

        <div className="mt-auto w-full flex items-end justify-between gap-[2%]">
          <div className="text-left text-[1.15cqw] leading-snug">
            <p className="font-semibold text-foreground">Certificate ID</p>
            <p className="font-mono">{certificate.id}</p>
            <p className="mt-[4%] font-semibold text-foreground">Issued</p>
            <p>{formatDate(certificate.issuedAt, "d MMMM yyyy")}</p>
          </div>
          <div className="text-center text-[1.15cqw]">
            <div className="w-[18cqw] border-b-[0.15cqw] border-primary pb-[2%] mb-[4%]">
              <span className="text-[2cqw] italic" style={{ fontFamily: "Georgia, serif" }}>
                V. Nair
              </span>
            </div>
            <p className="font-semibold text-foreground">Academy Director</p>
            <p className="text-muted-foreground">Auctech Academy</p>
          </div>
          <div className="flex flex-col items-center text-[1cqw] text-muted-foreground">
            <div className="bg-white p-[0.4cqw] border border-border">
              <QRCodeSVG value={url} size={256} className="w-[8cqw] h-[8cqw]" level="M" />
            </div>
            <p className="mt-[4%] inline-flex items-center gap-[0.4cqw]">
              <ShieldCheck className="w-[1.2cqw] h-[1.2cqw]" /> Verify at certify.auctech.in
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CertificateActions({ certificate, className, onPrint }) {
  const url = certificateUrl(certificate.id);
  const share = async () => {
    const data = { title: `${certificate.courseTitle} — Auctech Academy certificate`, text: `Verify ${certificate.studentName}'s certificate`, url };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Verification link copied to clipboard");
    } catch {
      toast.error("Could not share the certificate link");
    }
  };
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={onPrint ?? (() => window.print())}>
            <Download /> Download PDF
          </Button>
        </TooltipTrigger>
        <TooltipContent>Opens the print dialog — choose &ldquo;Save as PDF&rdquo; (landscape).</TooltipContent>
      </Tooltip>
      <Button variant="outline" onClick={share}>
        <Share2 /> Share certificate
      </Button>
    </div>
  );
}
