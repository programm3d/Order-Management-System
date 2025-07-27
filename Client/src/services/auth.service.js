import api from "./api.service";

const authService = {
  login: (email, password) => {
    return api.post("/auth/login", { email, password });
  },

  register: (userData) => {
    return api.post("/auth/register", userData);
  },

  getCurrentUser: () => {
    return api.get("/auth/me").then((response) => response.user);
  },

  logout: () => {
    return api.post("/auth/logout");
  },
};

export default authService;
