"use client";

import { useAuth } from "@/store/auth.store";

/**
 * Central HTTP client for the Auctech Academy API (Node/Express + MongoDB).
 *
 * Every domain service goes through `api`. The JWT from the auth store is
 * sent as a Bearer token; a 401 with an expired/invalid token clears the
 * local session so the route guards send the user back to /login.
 */

export class ApiError extends Error {
  status;
  code;
  details;
  constructor(message, status = 400, code = "bad_request", details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = "ApiError";
  }
}

/** Base URL of the backend, e.g. http://localhost:5000 (no trailing slash). */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");
export const API_BASE = `${API_URL}/api`;

function buildUrl(path, params) {
  const url = new URL(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, Array.isArray(v) ? v.join(",") : String(v));
    }
  }
  return url.toString();
}

function authHeader() {
  const token = useAuth.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  if (res.ok) {
    if (res.status === 204) return undefined;
    return await res.json();
  }
  const payload = await res.json().catch(() => ({}));
  if (res.status === 401 && (payload.code === "invalid_token" || payload.code === "unauthenticated")) {
    useAuth.getState().clearSession();
  }
  throw new ApiError(payload.message ?? res.statusText ?? "Request failed", res.status, payload.code ?? "http_error", payload.details);
}

async function request(method, path, body, params) {
  let res;
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...authHeader() },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(`Cannot reach the server at ${API_URL}. Check that the backend is running.`, 0, "network_error");
  }
  return handle(res);
}

export const api = {
  get: (path, params) => request("GET", path, undefined, params),
  post: (path, body) => request("POST", path, body ?? {}),
  put: (path, body) => request("PUT", path, body ?? {}),
  patch: (path, body) => request("PATCH", path, body ?? {}),
  delete: (path) => request("DELETE", path),

  /** multipart upload with progress (XHR, because fetch has no upload progress). */
  upload(path, file, params, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", buildUrl(path, params));
      for (const [k, v] of Object.entries(authHeader())) xhr.setRequestHeader(k, v);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () => {
        let payload = {};
        try {
          payload = JSON.parse(xhr.responseText || "{}");
        } catch {}
        if (xhr.status >= 200 && xhr.status < 300) resolve(payload);
        else reject(new ApiError(payload.message ?? "Upload failed", xhr.status, payload.code ?? "upload_error"));
      };
      xhr.onerror = () => reject(new ApiError(`Cannot reach the server at ${API_URL}.`, 0, "network_error"));
      const form = new FormData();
      form.append("file", file);
      xhr.send(form);
    });
  },

  /** Downloads an authenticated file (private uploads) and saves it in the browser. */
  async download(url, fileName) {
    const res = await fetch(url, { headers: authHeader() });
    if (!res.ok) await handle(res);
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = fileName ?? "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 10_000);
  },
};
