import { useState } from "react";
import { updateOrder } from "@/services/order.service";
import type { UpdateOrder } from "@/types/order";

export function useUpdateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = async (id: number, payload: UpdateOrder) => {
    try {
      setLoading(true);
      setError("");
      const response = await updateOrder(id, payload);
      return response.data?.data ?? response.data;
    } catch (err: any) {
      console.log("UPDATE ORDER ERROR:", err);
      const message = err?.response?.data?.message || "Failed to update order";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    update,
    loading,
    error,
  };
}
