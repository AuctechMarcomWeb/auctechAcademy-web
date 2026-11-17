import { useDb } from "@/store/db.store";
import { api } from "./api-client";
import { uploadService } from "./upload.service";

export const internshipService = {
  async list() {
    return api.get("/internships");
  },

  async getBySlug(slug) {
    return api.get(`/internships/${encodeURIComponent(slug)}`);
  },

  /** Uploads the résumé (if given) and submits the application. */
  async apply(userId, internshipId, input, resume) {
    void userId;
    let resumeUploadId;
    if (resume) resumeUploadId = (await uploadService.upload(resume, "resume")).id;
    const { application } = await api.post(`/internships/${encodeURIComponent(internshipId)}/apply`, {
      ...input,
      resumeFileName: resume?.name ?? input.resumeFileName,
      resumeUploadId,
    });
    useDb.getState().addApplication(application);
    return application;
  },

  async applicationsFor(userId) {
    void userId;
    return api.get("/me/applications");
  },

  /** Intern submits a task; mentors approve it from the admin portal. */
  async updateTask(applicationId, taskId, patch) {
    void patch;
    const { application } = await api.patch(`/me/applications/${encodeURIComponent(applicationId)}/tasks/${encodeURIComponent(taskId)}`, {
      status: "submitted",
    });
    useDb.getState().addApplication(application);
  },

  /* Admin */
  async save(internship) {
    const { internship: saved } = await api.put(`/admin/internships/${encodeURIComponent(internship.id)}`, internship);
    useDb.getState().upsertInternship(saved);
    return saved;
  },
  async remove(id) {
    await api.delete(`/admin/internships/${encodeURIComponent(id)}`);
    useDb.getState().deleteInternship(id);
  },
  async setApplicationStatus(applicationId, status, extras = {}) {
    const { application } = await api.patch(`/admin/applications/${encodeURIComponent(applicationId)}`, { status, ...extras });
    useDb.getState().addApplication(application);
  },
};
