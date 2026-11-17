import { SITE } from "@/lib/constants";
import { useDb } from "@/store/db.store";
import { api } from "./api-client";

export const CERTIFICATE_ID_PATTERN = /^[A-Z]{2,6}-[A-Z]{2,6}-\d{4}-\d{6}$/;

export function certificateUrl(id) {
  return `${SITE.url}/verify/${encodeURIComponent(id)}`;
}

export function normalizeCertificateId(raw) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export const certificateService = {
  async forUser(userId) {
    void userId;
    return api.get("/me/certificates");
  },

  /** Public verification. The server logs every lookup against the certificate record. */
  async verify(rawId, source = "web") {
    return api.post("/certificates/verify", { id: normalizeCertificateId(rawId), source });
  },

  /* Admin */
  async revoke(id, reason) {
    const { certificate } = await api.post(`/admin/certificates/${encodeURIComponent(id)}/revoke`, { reason });
    useDb.getState().addCertificate(certificate);
    return certificate;
  },

  async reinstate(id) {
    const { certificate } = await api.post(`/admin/certificates/${encodeURIComponent(id)}/reinstate`);
    useDb.getState().addCertificate(certificate);
  },
};
