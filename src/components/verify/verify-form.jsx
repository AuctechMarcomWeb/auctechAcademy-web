"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, QrCode, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { VerificationResultCard } from "./verification-result";
import { certificateService, normalizeCertificateId } from "@/services/certificate.service";
import { useHydrated } from "@/hooks/use-hydrated";
import { useServerConfig } from "@/services/sync.service";
import { ROUTES } from "@/lib/constants";

const SAMPLES = ["AUC-DM-2026-000124", "AUC-FSWD-2026-000033", "AUC-XX-2026-999999"];

export function VerifyForm({ initialId }) {
  const serverConfig = useServerConfig((st) => st.config);
  const router = useRouter();
  const hydrated = useHydrated();
  const [value, setValue] = useState(initialId ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const run = useCallback(async (id, source) => {
    setBusy(true);
    setResult(null);
    try {
      setResult(await certificateService.verify(id, source));
    } finally {
      setBusy(false);
    }
  }, []);

  // Auto-verify when arriving via /verify/[id] (QR scan). Deferred so the
  // registry store has rehydrated before the lookup runs.
  useEffect(() => {
    if (!hydrated || !initialId) return;
    const t = setTimeout(() => void run(initialId, "qr"), 0);
    return () => clearTimeout(t);
  }, [hydrated, initialId, run]);

  const submit = (e) => {
    e.preventDefault();
    const id = normalizeCertificateId(value);
    if (!id) return;
    if (initialId !== undefined) router.replace(ROUTES.verifyCertificate(id));
    void run(id, "web");
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <QrCode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              data-testid="verify-input"
              value={value}
              onChange={(e) => setValue(e.target.value.toUpperCase())}
              placeholder="AUC-DM-2026-000124"
              className="pl-9 font-mono uppercase"
              aria-label="Certificate ID"
              autoComplete="off"
            />
          </div>
          <Button data-testid="verify-submit" type="submit" loading={busy} disabled={!value.trim()}>
            <Search /> Verify
          </Button>
        </form>
        {serverConfig?.demoReset && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <FlaskConical className="h-3.5 w-3.5" /> Try a sample:
            </span>
            {SAMPLES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setValue(s)}
                className="rounded-full border border-border bg-card px-2 py-0.5 font-mono hover:border-secondary cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </Card>

      {busy && <Card className="p-8 text-center text-sm text-muted-foreground">Checking the certificate registry…</Card>}
      {result && !busy && <VerificationResultCard result={result} />}
    </div>
  );
}
