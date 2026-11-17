import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Card } from "@/components/ui/card";
import { siteHref } from "@/lib/constants";

export function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="container-x py-10 sm:py-16 flex justify-center">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <Card className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-center">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground text-center">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </Card>
        {footer && <p className="mt-5 text-center text-sm text-muted-foreground">{footer}</p>}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href={siteHref("/privacy")} className="hover:text-foreground">
            Privacy
          </Link>{" "}
          ·{" "}
          <Link href={siteHref("/terms")} className="hover:text-foreground">
            Terms
          </Link>
        </p>
      </div>
    </div>
  );
}
