import { Badge } from "@/components/ui/badge";

const MAP = {
  // generic
  active: { label: "Active", variant: "success" },
  completed: { label: "Completed", variant: "secondary" },
  refunded: { label: "Refunded", variant: "muted" },
  suspended: { label: "Suspended", variant: "destructive" },
  published: { label: "Published", variant: "success" },
  draft: { label: "Draft", variant: "warning" },
  archived: { label: "Archived", variant: "muted" },
  open: { label: "Open", variant: "success" },
  closed: { label: "Closed", variant: "muted" },
  // payments
  pending: { label: "Pending", variant: "warning" },
  successful: { label: "Successful", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "muted" },
  // assignments
  submitted: { label: "Submitted", variant: "secondary" },
  under_review: { label: "Under Review", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  // certificates
  valid: { label: "Valid", variant: "success" },
  revoked: { label: "Revoked", variant: "destructive" },
  // internship applications
  applied: { label: "Applied", variant: "secondary" },
  shortlisted: { label: "Shortlisted", variant: "accent" },
  interview: { label: "Interview", variant: "warning" },
  selected: { label: "Selected", variant: "success" },
  // tasks
  todo: { label: "To do", variant: "muted" },
  in_progress: { label: "In progress", variant: "warning" },
  // lock states
  locked: { label: "Locked", variant: "muted" },
  available: { label: "Available", variant: "secondary" },
};

export function StatusBadge({ status, className }) {
  const entry = MAP[status] ?? { label: status, variant: "outline" };
  return (
    <Badge variant={entry.variant} className={className}>
      {entry.label}
    </Badge>
  );
}
