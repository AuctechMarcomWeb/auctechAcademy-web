import { useAuth } from "@/store/auth.store";
import { useDb } from "@/store/db.store";
import { useLearning } from "@/store/learning.store";
import { api, API_BASE, ApiError } from "./api-client";
import { syncService, useServerConfig } from "./sync.service";

async function startSession({ token, user }) {
  useAuth.getState().setSession({ userId: user.id, role: user.role, token });
  useDb.getState().upsertUser(user);
  await syncService.load();
  return user;
}

export const authService = {
  async login({ email, password }) {
    return startSession(await api.post("/auth/login", { email: email.trim().toLowerCase(), password }));
  },

  async register(input) {
    return startSession(await api.post("/auth/register", { ...input, email: input.email.trim().toLowerCase(), phone: input.phone || undefined }));
  },

  /** Signs in with a token handed back by the Google OAuth callback (see /auth/callback page). */
  async loginWithToken(token) {
    useAuth.getState().setSession({ userId: "pending", role: "student", token });
    const { user } = await api.get("/auth/me");
    return startSession({ token, user });
  },

  /**
   * Google sign-in: full-page redirect to the backend, which runs the OAuth
   * code flow and sends the browser back to `/auth/callback#token=…`.
   */
  async loginWithGoogle() {
    const config = useServerConfig.getState().config;
    if (config && !config.googleEnabled) {
      throw new ApiError(
        "Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the backend.",
        501,
        "oauth_not_configured",
      );
    }
    const returnTo = `${window.location.origin}/auth/callback`;
    window.location.assign(`${API_BASE}/auth/google?returnTo=${encodeURIComponent(returnTo)}`);
    return new Promise(() => {});
  },

  async forgotPassword(email) {
    return api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
  },

  async resetPassword(email, token, password) {
    return startSession(await api.post("/auth/reset-password", { email: email.trim().toLowerCase(), token, password }));
  },

  async logout() {
    const { userId } = useAuth.getState();
    if (useAuth.getState().token) await api.post("/auth/logout").catch(() => {});
    useAuth.getState().clearSession();
    syncService.clearCache();
    if (userId) useLearning.getState().clearUser(userId);
    await syncService.load();
  },

  me() {
    const { userId } = useAuth.getState();
    return userId ? useDb.getState().users.find((u) => u.id === userId) : undefined;
  },

  async updateProfile(userId, patch) {
    const { user } = await api.patch("/auth/me", patch);
    useDb.getState().upsertUser(user);
    void userId;
    return user;
  },

  async updateNotifications(prefs) {
    const { user } = await api.put("/auth/me/notifications", prefs);
    useDb.getState().upsertUser(user);
    return user;
  },

  async changePassword(userId, current, next) {
    const res = await api.post("/auth/change-password", { current, next });
    // Changing the password signs out other devices; keep this one signed in with the fresh token.
    useAuth.getState().setSession({ userId: res.user.id, role: res.user.role, token: res.token });
    void userId;
    return { ok: true };
  },
};
