import { api } from "./apiClient";
import * as SecureStore from "expo-secure-store";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  const data = response.data?.data ?? response.data;

  if (data?.token) {
    await SecureStore.setItemAsync("token", data.token);
  }

  if (data?.user) {
    await SecureStore.setItemAsync(
      "user",
      JSON.stringify(data.user)
    );
  }

  return data as LoginResponse;
};

export const logout = async (): Promise<void> => {
  await SecureStore.deleteItemAsync("token");
  await SecureStore.deleteItemAsync("user");
};

export const getStoredUser = async (): Promise<User | null> => {
  try {
    const raw = await SecureStore.getItemAsync("user");

    if (!raw) return null;

    return JSON.parse(raw) as User;
  } catch (error) {
    console.log("GET STORED USER ERROR:", error);
    return null;
  }
};

export const getToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync("token");
};