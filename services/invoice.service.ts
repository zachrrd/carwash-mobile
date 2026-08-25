import { api } from "./apiClient";

export const getInvoiceById = (id: number) => {
  return api.get(`/invoices/${id}`);
};
