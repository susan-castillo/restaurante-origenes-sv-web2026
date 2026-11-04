import { apiRequest } from "./api.js";

export const authService = {
  login(credentials) {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  profile(token) {
    return apiRequest("/auth/profile", { token });
  },
};
