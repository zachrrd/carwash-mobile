export interface Customer {
  id: number;
  name: string;
  phone: string | null;
}

export interface CreateCustomer {
  name: string;
  phone?: string;
}

export interface UpdateCustomer {
  name: string;
  phone?: string;
}
