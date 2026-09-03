import { create } from "axios";
import * as SecureStore from "expo-secure-store";

export const api = create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://192.168.18.250:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("token");
    }

    return Promise.reject(error);
  },
);
