import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", className, variant = "dark", size = "md", withWordmark = true }) {
  const px = size === "sm" ? 28 : 36;
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 shrink-0", className)} aria-label="Auctech Academy home">
      <Image src="/auctech-logo.png" alt="" width={px} height={Math.round((px * 472) / 558)} priority className="object-contain" />
      {withWordmark && (
        <span className={cn("flex flex-col leading-none", variant === "light" ? "text-white" : "text-primary")}>
          <span className={cn("font-bold tracking-tight", size === "sm" ? "text-base" : "text-lg")}>Auctech</span>
          <span
            className={cn("text-[10px] font-semibold uppercase tracking-[0.22em]", variant === "light" ? "text-white/70" : "text-muted-foreground")}
          >
            Academy
          </span>
        </span>
      )}
    </Link>
  );
}
