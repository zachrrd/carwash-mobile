export interface Staff {
  id: number;
  name: string;
  phone: string | null;
  status: string | null;
}
export interface CreateStaff {
  name: string;
  phone: string;
  status: string | null;
}
