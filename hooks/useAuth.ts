import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import {
  logout as logoutService,
  getStoredUser,
} from "@/services/auth.service";
import type { User } from "@/services/auth.service";

export function useAuth() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const stored = await getStoredUser();

      if (!stored) {
        setUser(null);
        setError("User tidak ditemukan");
        return;
      }

      setUser(stored);
    } catch (err) {
      console.log("GET USER ERROR:", err);
      setUser(null);
      setError("Gagal memuat profile");
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutService();
      setUser(null);
      router.replace("/login");
    } catch (err) {
      console.log("LOGOUT ERROR:", err);
      router.replace("/login");
    }
  }, [router]);

  return {
    user,
    loading,
    error,
    fetchUser,
    logout,
  };
}