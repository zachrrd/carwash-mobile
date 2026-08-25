export interface Invoice {
  id: number;
  invoice_no: string;
  order_id: number;
  total_amount: string;
  issued_at: string | null;

  orders: {
    id: number;
    order_date: string | null;
    service_status: string | null;
    payment_status: string | null;
    customer_id: number;
    vehicle_id: number;
    staff_id: number | null;
    check_in_time: string | null;

    customers: {
      id: number;
      name: string;
      phone: string | null;
    };

    vehicles: {
      id: number;
      plate_number: string;
      brand: string;
      model: string;
      customer_id: number;
    };

    staffs: {
      id: number;
      name: string;
      phone: string | null;
      status: string | null;
    } | null;

    order_items: {
      id: number;
      order_id: number;
      service_id: number;
      qty: number | null;
      subtotal: string;

      services: {
        id: number;
        name: string;
        duration: number;
        price: string;
        status: string | null;
      };
    }[];

    payments: {
      id: number;
      order_id: number;
      amount_received: string;
      change_amount: string | null;
      payment_method: string;
      payment_date: string | null;
    }[];
  };
}
