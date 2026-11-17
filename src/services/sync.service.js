"use client";

import { create } from "zustand";
import { useAuth } from "@/store/auth.store";
import { useDb } from "@/store/db.store";
import { useLearning } from "@/store/learning.store";
import { api, ApiError } from "./api-client";

export const useServerConfig = create()((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
}));

let inflight = null;
let queued = false;

/* ---------- Saved copy of the last sync (instant page loads) ---------- */

const CACHE_KEY = "auctech.cache.v1";
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function saveCache(payload) {
  try {
    const entry = { userId: payload.me?.id ?? null, savedAt: Date.now(), config: useServerConfig.getState().config, payload };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Storage full or blocked (private mode): the app still works, just without the instant start.
  }
}

function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
}

/**
 * Shows the last data this browser received for the same user immediately,
 * while a fresh copy loads in the background. Returns true if it restored.
 */
function restoreCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const entry = JSON.parse(raw);
    const userId = useAuth.getState().userId;
    if (entry.userId !== (userId ?? null) || Date.now() - entry.savedAt > CACHE_MAX_AGE_MS) return false;
    if (entry.config && !useServerConfig.getState().config) useServerConfig.getState().setConfig(entry.config);
    useDb.getState().applySync(entry.payload);
    useLearning.getState().applySync(entry.payload.learning);
    useDb.getState().setHydrated(true);
    useLearning.getState().setHydrated(true);
    return true;
  } catch {
    return false;
  }
}

async function runSync() {
  const db = useDb.getState();
  db.setSyncState({ syncing: true });
  try {
    const hadToken = Boolean(useAuth.getState().token);
    const [payload, config] = await Promise.all([
      api.get("/sync"),
      useServerConfig.getState().config ? Promise.resolve(null) : api.get("/config").catch(() => null),
    ]);
    if (config) useServerConfig.getState().setConfig(config);
    // The stored token was rejected (expired, password changed, suspended).
    if (hadToken && !payload.me) useAuth.getState().clearSession();
    if (payload.me) {
      const { role } = useAuth.getState();
      if (role !== payload.me.role) useAuth.getState().setSession({ userId: payload.me.id, role: payload.me.role, token: useAuth.getState().token });
    }
    useDb.getState().applySync(payload);
    useLearning.getState().applySync(payload.learning);
    saveCache(payload);
  } catch (e) {
    useDb.getState().setSyncState({ syncError: e instanceof ApiError ? e.message : "Could not load data from the server." });
  } finally {
    useDb.getState().setSyncState({ syncing: false });
    useDb.getState().setHydrated(true);
    useLearning.getState().setHydrated(true);
  }
}

export const syncService = {
  /** Loads (or reloads) everything the current user can see. Concurrent calls are coalesced. */
  async load() {
    if (inflight) {
      queued = true;
      return inflight;
    }
    inflight = (async () => {
      do {
        queued = false;
        await runSync();
      } while (queued);
    })().finally(() => {
      inflight = null;
    });
    return inflight;
  },
  /** Background refresh that never blocks the UI. */
  refresh() {
    void syncService.load();
  },
  /** Paint from the saved copy (if it belongs to the current user), then refresh from the server. */
  start() {
    restoreCache();
    void syncService.load();
  },
  /** Forget the saved copy (on sign-out). */
  clearCache,
};
