import { api } from "./apiClient";
import type { CreateCustomer, UpdateCustomer } from "@/types/customer";

export const getCustomers = (page = 1, limit = 10) => {
  return api.get("/customers", { params: { page, limit } });
};

export const createCustomer = (data: CreateCustomer) => {
  return api.post("/customers", data);
};

export const updateCustomer = (id: number, data: UpdateCustomer) => {
  return api.put(`/customers/${id}`, data);
};

export const deleteCustomer = (id: number) => {
  return api.delete(`/customers/${id}`);
};
