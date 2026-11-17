import { api } from "./api-client";

export const contactService = {
  send(input) {
    return api.post("/contact", input);
  },
};
