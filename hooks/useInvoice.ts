import { useEffect, useState } from "react";
import { getInvoiceById } from "@/services/invoice.service";
import type { Invoice } from "@/types/invoice";

export function useInvoice(id?: string) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadInvoice = async () => {
      if (!id) {
        if (!cancelled) {
          setInvoice(null);
          setError("Invoice ID tidak ditemukan");
          setLoading(false);
        }
        return;
      }

      const invoiceId = Number(id);

      if (Number.isNaN(invoiceId)) {
        if (!cancelled) {
          setInvoice(null);
          setError("Invoice ID tidak valid");
          setLoading(false);
        }
        return;
      }

      try {
        if (!cancelled) {
          setLoading(true);
          setError("");
        }

        const response = await getInvoiceById(invoiceId);

        if (!cancelled) {
          setInvoice(response.data?.data ?? response.data ?? null);
        }
      } catch (err: any) {
        console.log("GET INVOICE ERROR:", err);

        if (!cancelled) {
          setError(
            err?.response?.data?.message || "Gagal mengambil data invoice",
          );
          setInvoice(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadInvoice();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const refetch = async () => {
    if (!id) {
      setInvoice(null);
      setError("Invoice ID tidak ditemukan");
      setLoading(false);
      return;
    }

    const invoiceId = Number(id);

    if (Number.isNaN(invoiceId)) {
      setInvoice(null);
      setError("Invoice ID tidak valid");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getInvoiceById(invoiceId);

      setInvoice(response.data?.data ?? response.data ?? null);
    } catch (err: any) {
      console.log("GET INVOICE ERROR:", err);

      setError(err?.response?.data?.message || "Gagal mengambil data invoice");
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    invoice,
    loading,
    error,
    refetch,
  };
}
