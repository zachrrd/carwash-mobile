import { api } from "./apiClient";

export const getServices = (page = 1, limit = 100) => {
  return api.get(`/services?page=${page}&limit=${limit}`);
};
