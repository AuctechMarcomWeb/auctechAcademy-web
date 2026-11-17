import { RouteGuard } from "@/components/layout/route-guard";

export const metadata = { title: "Course Player", robots: { index: false } };

/** The course player has its own full-screen chrome, so it skips the portal shell. */
export default function LearnLayout({ children }) {
  return <RouteGuard role="student">{children}</RouteGuard>;
}
