import { useState } from "react";
import { createOrder } from "@/services/order.service";
import type { CreateOrder } from "@/types/order";

export function useCreateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const create = async (payload: CreateOrder) => {
    try {
      setLoading(true);
      setError("");

      const response = await createOrder(payload);
      return response.data?.data ?? response.data;
    } catch (err: any) {
      console.log("CREATE ORDER ERROR:", err);
      const message = err?.response?.data?.message || "Failed to create order";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    create,
    loading,
    error,
  };
}
