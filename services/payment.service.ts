import { api } from "./apiClient";

export const getPayments = (page: number = 1, limit: number = 10) => {
  return api.get("/payments", {
    params: {
      page,
      limit,
    },
  });
};

export const getPaymentByOrder = (orderId: number) => {
  return api.get(`/payments/order/${orderId}`);
};

export const createPayment = (data: {
  order_id: number;
  amount_received: number;
  payment_method: string;
}) => {
  return api.post("/payments", data);
};
