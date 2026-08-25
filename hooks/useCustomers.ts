import { useCallback, useState } from "react";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/services/customer.service";
import type {
  Customer,
  CreateCustomer,
  UpdateCustomer,
} from "@/types/customer";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCustomers = useCallback(
    async (pageNum = 1, isRefresh = false, limit = 10) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError("");

        const response = await getCustomers(pageNum, limit);
        const data = response.data?.data;

        setCustomers(data?.customers ?? data?.data ?? []);
        setTotalPages(data?.pagination?.totalPages ?? 1);
        setTotal(data?.pagination?.total ?? 0);
        setPage(pageNum);
      } catch (err: any) {
        console.log("GET CUSTOMERS ERROR:", err);
        setError(err?.response?.data?.message || "Failed to load customers");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  const addCustomer = async (payload: CreateCustomer) => {
    await createCustomer(payload);
    await fetchCustomers(page, false, 10);
  };

  const editCustomer = async (id: number, payload: UpdateCustomer) => {
    await updateCustomer(id, payload);
    await fetchCustomers(page, false, 10);
  };

  const removeCustomer = async (id: number) => {
    await deleteCustomer(id);
    await fetchCustomers(page, false, 10);
  };

  return {
    customers,
    loading,
    refreshing,
    error,
    page,
    totalPages,
    total,
    fetchCustomers,
    addCustomer,
    editCustomer,
    removeCustomer,
    setPage,
  };
}
