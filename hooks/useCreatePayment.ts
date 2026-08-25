import { useState } from "react";
import { createPayment } from "@/services/payment.service";
import type { CreatePaymentPayload } from "@/types/payment";

export function useCreatePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pay = async (payload: CreatePaymentPayload) => {
    try {
      setLoading(true);
      setError("");

      const response = await createPayment(payload);
      return response.data?.data ?? response.data;
    } catch (err: any) {
      console.log("CREATE PAYMENT ERROR:", err);
      const message =
        err?.response?.data?.message || "Failed to process payment";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    pay,
    loading,
    error,
  };
}
