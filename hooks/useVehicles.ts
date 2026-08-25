import { useCallback, useState } from "react";
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "@/services/vehicle.service";
import type { Vehicle, CreateVehicle, UpdateVehicle } from "@/types/vehicle";

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchVehicles = useCallback(
    async (pageNum = 1, isRefresh = false, limit = 10) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError("");

        const response = await getVehicles(pageNum, limit);
        const data = response.data?.data;

        setVehicles(data?.vehicles ?? data?.data ?? []);
        setTotalPages(data?.pagination?.totalPages ?? 1);
        setTotal(data?.pagination?.total ?? 0);
        setPage(pageNum);
      } catch (err: any) {
        console.log("GET VEHICLES ERROR:", err);
        setError(err?.response?.data?.message || "Failed to load vehicles");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  const addVehicle = async (payload: CreateVehicle) => {
    await createVehicle(payload);
    // Setelah create, kembali ke page 1 biar data baru kelihatan
    await fetchVehicles(1, false, 10);
  };

  const editVehicle = async (id: number, payload: UpdateVehicle) => {
    await updateVehicle(id, payload);
    await fetchVehicles(page, false, 10);
  };

  const removeVehicle = async (id: number) => {
    await deleteVehicle(id);
    await fetchVehicles(page, false, 10);
  };

  return {
    vehicles,
    loading,
    refreshing,
    error,
    page,
    totalPages,
    total,
    fetchVehicles,
    addVehicle,
    editVehicle,
    removeVehicle,
    setPage,
  };
}