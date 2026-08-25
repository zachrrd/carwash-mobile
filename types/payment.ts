export type CreatePaymentPayload = {
  order_id: number;
  amount_received: number;
  payment_method: string;
};

export interface PaymentService {
  id: number;
  name: string;
  duration: number;
  price: string;
  status: string;
}

export interface PaymentOrderItem {
  id: number;
  order_id: number;
  service_id: number;
  qty: number;
  subtotal: string;
  services: PaymentService;
}

export interface PaymentCustomer {
  id: number;
  name: string;
  phone: string | null;
}

export interface PaymentVehicle {
  id: number;
  plate_number: string;
  brand: string;
  model: string;
  customer_id: number;
}

export interface PaymentStaff {
  id: number;
  name: string;
  phone: string;
  status: string;
}

export interface PaymentOrder {
  id: number;
  order_date: string;
  service_status: string;
  payment_status: string;
  customer_id: number;
  vehicle_id: number;
  staff_id: number | null;
  check_in_time: string | null;

  customers: PaymentCustomer;
  vehicles: PaymentVehicle;
  staffs: PaymentStaff | null;
  order_items: PaymentOrderItem[];
  invoices: PaymentInvoice[];
}

export interface Payment {
  id: number;
  order_id: number;
  amount_received: string;
  change_amount: string;
  payment_method: string;
  payment_date: string;
  orders: PaymentOrder;
}

export interface PaymentInvoice {
  id: number;
  invoice_no: string;
  order_id: number;
  total_amount: string;
  issued_at: string | null;
}
