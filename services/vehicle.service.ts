import { api } from "./apiClient";
import type { CreateVehicle, UpdateVehicle } from "@/types/vehicle";

export const getVehicles = (page = 1, limit = 10) => {
  return api.get("/vehicles", { params: { page, limit } });
};

export const createVehicle = (data: CreateVehicle) => {
  return api.post("/vehicles", data);
};

export const updateVehicle = (id: number, data: UpdateVehicle) => {
  return api.put(`/vehicles/${id}`, data);
};

export const deleteVehicle = (id: number) => {
  return api.delete(`/vehicles/${id}`);
};
