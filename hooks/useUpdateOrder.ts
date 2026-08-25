import { useState } from "react";
import { updateOrder } from "@/services/order.service";
import type { OrderStatus } from "@/types/order";

export type UpdateOrderPayload = {
  customer_id: number;
  vehicle_id: number;
  staff_id: number | null;
  service_status: OrderStatus;
  check_in_time: string | null;
  items: {
    service_id: number;
    qty: number;
  }[];
};

export function useUpdateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = async (id: number, payload: UpdateOrderPayload) => {
    try {
      setLoading(true);
      setError("");
      await updateOrder(id, payload);
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
