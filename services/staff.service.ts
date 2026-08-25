import { api } from "./apiClient";

export const getStaffs = (page = 1, limit = 100) => {
  return api.get(`/staffs?page=${page}&limit=${limit}`);
};
