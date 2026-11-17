import { RouteGuard } from "@/components/layout/route-guard";
import { PortalShell } from "@/components/layout/portal-shell";

export const metadata = { title: "Student Portal", robots: { index: false } };

export default function StudentLayout({ children }) {
  return (
    <RouteGuard role="student">
      <PortalShell portal="student" portalName="Student Portal">
        {children}
      </PortalShell>
    </RouteGuard>
  );
}
