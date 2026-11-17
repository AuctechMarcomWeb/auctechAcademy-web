import { api } from "./api-client";

export const uploadService = {
  async upload(file, kind, onProgress) {
    const { upload } = await api.upload("/uploads", file, { kind }, onProgress);
    return upload;
  },
  download(url, fileName) {
    return api.download(url, fileName);
  },
};
