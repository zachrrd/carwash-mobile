import { useCallback, useEffect, useState } from "react";
import { getOrderById } from "@/services/order.service";
import type { Order } from "@/types/order";

export function useOrder(id?: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrder = useCallback(async () => {
    if (!id) {
      setOrder(null);
      setError("Invalid order id");
      setLoading(false);
      return;
    }

    const orderId = Number(id);

    if (Number.isNaN(orderId)) {
      setOrder(null);
      setError("Invalid order id");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getOrderById(orderId);
      setOrder(response.data.data);
    } catch (err: any) {
      console.log("GET ORDER ERROR:", err);
      setError(err?.response?.data?.message || "Failed to load order");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!id) {
        if (!cancelled) {
          setOrder(null);
          setError("Invalid order id");
          setLoading(false);
        }
        return;
      }

      const orderId = Number(id);

      if (Number.isNaN(orderId)) {
        if (!cancelled) {
          setOrder(null);
          setError("Invalid order id");
          setLoading(false);
        }
        return;
      }

      try {
        if (!cancelled) {
          setLoading(true);
          setError("");
        }

        const response = await getOrderById(orderId);

        if (!cancelled) {
          setOrder(response.data.data);
        }
      } catch (err: any) {
        console.log("GET ORDER ERROR:", err);

        if (!cancelled) {
          setError(err?.response?.data?.message || "Failed to load order");
          setOrder(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ✅ Sekarang stabil
  const refetch = useCallback(() => {
    return loadOrder();
  }, [loadOrder]);

  return {
    order,
    loading,
    error,
    refetch,
  };
}