import { api } from "./apiClient";
import type { CreateOrder, UpdateOrder, OrderStatus } from "@/types/order";

export const getOrders = (page = 1, limit = 20, search?: string) => {
  return api.get("/orders", {
    params: {
      page,
      limit,
      ...(search ? { search } : {}),
    },
  });
};

export const getOrderById = (id: number) => {
  return api.get(`/orders/${id}`);
};

export const createOrder = (data: CreateOrder) => {
  return api.post("/orders", data);
};

export const updateOrder = (id: number, data: UpdateOrder) => {
  return api.put(`/orders/${id}`, data);
};

export const updateOrderStatus = (id: number, service_status: OrderStatus) => {
  return api.patch(`/orders/${id}/status`, {
    service_status,
  });
};

export const completeOrder = (id: number) => {
  return api.patch(`/orders/${id}/complete`);
};

export const cancelOrder = (id: number) => {
  return api.patch(`/orders/${id}/cancel`);
};

export const deleteOrder = (id: number) => {
  return api.delete(`/orders/${id}`);
};