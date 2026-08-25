import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import { LogOut, User as UserIcon, Mail, Shield } from "lucide-react-native";
import { useAuth } from "@/hooks/useAuth";

export default function ProfileScreen() {
  const { user, loading, error, fetchUser, logout } = useAuth();

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [fetchUser]),
  );

  const handleLogout = () => {
    Alert.alert("Logout", "Yakin ingin keluar dari akun?", [
      {
        text: "Batal",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#111827" />
        <Text className="mt-4 text-sm text-gray-500">Loading profile...</Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-5">
        <Text className="text-lg font-semibold text-red-600">
          {error || "Gagal memuat profil"}
        </Text>
        <Pressable
          onPress={fetchUser}
          className="mt-5 rounded-xl bg-gray-900 px-5 py-3"
        >
          <Text className="font-semibold text-white">Coba Lagi</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 px-5 pt-[60px]">
      <Text className="mb-1 text-[28px] font-bold text-gray-900">Profile</Text>
      <Text className="mb-8 text-sm text-gray-500">
        Informasi akun yang sedang login
      </Text>

      <View className="mb-6 items-center">
        <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-gray-200">
          <UserIcon size={40} color="#6B7280" />
        </View>
        <Text className="text-xl font-bold text-gray-900">{user.name}</Text>
        <Text className="mt-1 text-sm text-gray-500">{user.role}</Text>
      </View>

      <View className="mb-8 rounded-2xl border border-gray-200 bg-white p-5">
        <View className="mb-5 flex-row items-center">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
            <UserIcon size={18} color="#6B7280" />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-400">Nama</Text>
            <Text className="mt-0.5 text-[15px] font-medium text-gray-900">
              {user.name}
            </Text>
          </View>
        </View>

        <View className="mb-5 flex-row items-center">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
            <Mail size={18} color="#6B7280" />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-400">Email</Text>
            <Text className="mt-0.5 text-[15px] font-medium text-gray-900">
              {user.email}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
            <Shield size={18} color="#6B7280" />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-400">Role</Text>
            <Text className="mt-0.5 text-[15px] font-medium text-gray-900">
              {user.role}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={handleLogout}
        className="h-14 flex-row items-center justify-center rounded-2xl bg-red-500"
      >
        <LogOut size={20} color="#FFFFFF" />
        <Text className="ml-2 text-[16px] font-semibold text-white">
          Logout
        </Text>
      </Pressable>
    </View>
  );
}