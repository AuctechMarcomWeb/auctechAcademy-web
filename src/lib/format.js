import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

export function formatINR(amount, opts = {}) {
  if (opts.compact && amount >= 100000) {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec > 0 ? `${sec}s` : ""}`.trim();
  return `${sec}s`;
}

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatHours(totalSeconds) {
  const hours = totalSeconds / 3600;
  return hours >= 10 ? `${Math.round(hours)}h` : `${hours.toFixed(1)}h`;
}

export function formatDate(iso, pattern = "d MMM yyyy") {
  if (!iso) return "—";
  const d = typeof iso === "string" ? parseISO(iso) : iso;
  return format(d, pattern);
}

export function formatDateTime(iso) {
  return formatDate(iso, "d MMM yyyy, h:mm a");
}

export function timeAgo(iso) {
  return `${formatDistanceToNowStrict(parseISO(iso))} ago`;
}

export function percent(n, d) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

export function pluralize(n, word, plural = `${word}s`) {
  return `${n} ${n === 1 ? word : plural}`;
}
