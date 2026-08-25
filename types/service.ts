export interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
  status: string | null;
}

export interface CreateService {
  name: string;
  duration: number;
  price: number;
  status: string | null;
}
