export interface Vehicle {
  id: number;
  customer_id: number;
  plate_number: string;
  brand: string;
  model: string;
  customers?: {
    id: number;
    name: string;
    phone?: string | null;
  };
}

export interface CreateVehicle {
  customer_id: number;
  plate_number: string;
  brand: string;
  model: string;
}

export interface UpdateVehicle {
  customer_id: number;
  plate_number: string;
  brand: string;
  model: string;
}
