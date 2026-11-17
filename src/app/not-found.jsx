import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-6">
      <Logo className="mb-8" />
      <p className="text-sm font-semibold uppercase tracking-wider text-secondary">404</p>
      <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">The page you are looking for doesn&apos;t exist or has been moved.</p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/explore">Explore courses</Link>
        </Button>
      </div>
    </div>
  );
}
