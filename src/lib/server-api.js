/**
 * Server-side fetch for metadata (page titles / Open Graph). Uses
 * API_URL_INTERNAL when the web server reaches the backend on a private
 * address (e.g. Docker), otherwise NEXT_PUBLIC_API_URL.
 */
const BASE = (process.env.API_URL_INTERNAL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");

export async function serverGet(path) {
  try {
    const res = await fetch(`${BASE}/api${path}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
