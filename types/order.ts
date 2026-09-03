// =========================
// STATUS ENUMS
// =========================

export type OrderStatus =
  | "WAITING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED" | "FAILED";

export type PaymentMethod = "CASH" | "TRANSFER" | "QRIS";

// =========================
// RELATED ENTITIES
// =========================

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  deleted_at?: string | null;
}

export interface Vehicle {
  id: number;
  plate_number: string;
  brand: string;
  model: string;
  customer_id?: number;
  deleted_at?: string | null;
}

export interface Staff {
  id: number;
  name: string;
  phone?: string | null;
  status?: "ACTIVE" | "INACTIVE" | string | null;
  deleted_at?: string | null;
}

export interface Service {
  id: number;
  name: string;
  price: number | string;
  duration?: number;
  status?: "ACTIVE" | "INACTIVE" | string | null;
  image_url?: string | null;
  deleted_at?: string | null;
}

// =========================
// ORDER ITEM
// =========================

export interface OrderItem {
  id: number;
  order_id?: number;
  service_id: number;
  qty: number | null;
  subtotal: string | number;
  services?: Service;
}

// =========================
// INVOICE
// =========================

export interface Invoice {
  id: number;
  invoice_no: string;
  order_id: number;
  total_amount: number | string;
  issued_at: string | null;
  orders?: Order;
}

// =========================
// ORDER
// =========================

export interface Order {
  id: number;
  order_date: string | null;
  service_status: OrderStatus | string | null;
  payment_status: PaymentStatus | string | null;

  customer_id: number;
  vehicle_id: number;
  staff_id: number | null;
  check_in_time: string | null;

  customers?: Customer;
  vehicles?: Vehicle;
  staffs?: Staff | null;

  payments?: {
    id: number;
    order_id: number;
    amount_received: string | number;
    change_amount?: string | number | null;
    payment_method: string;
    payment_date?: string | null;
    payment_status?: string | null;
  }[];
  order_items?: OrderItem[];
  invoices?: Invoice[];
}

// =========================
// PAGINATION
// =========================

export interface OrdersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetOrdersResponse {
  data: Order[];
  pagination: OrdersPagination;
}

// =========================
// PAYLOAD CREATE & UPDATE
// =========================

export interface OrderItemPayload {
  service_id: number;
  qty: number;
}

export interface CreateOrder {
  customer_id: number;
  vehicle_id: number;
  staff_id?: number | null;
  check_in_time?: string | null;
  items: OrderItemPayload[];
}

export interface UpdateOrder {
  customer_id?: number;
  vehicle_id?: number;
  staff_id?: number | null;
  check_in_time?: string | null;
  items?: OrderItemPayload[];
}
