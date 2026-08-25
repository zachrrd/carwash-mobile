import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Mail, Lock, Eye, EyeOff, Car } from "lucide-react-native";
import { login } from "@/services/auth.service";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email dan password wajib diisi");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(email, password);

      router.replace("/(tabs)/customers");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Email atau password salah";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-6 py-12">
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-blue-600 rounded-2xl items-center justify-center mb-4">
              <Car size={40} color="white" strokeWidth={2} />
            </View>

            <Text className="text-3xl font-bold text-gray-900">
              CarWash
            </Text>

            <Text className="text-gray-500 mt-2 text-center">
              Masuk ke akun kamu untuk melanjutkan
            </Text>
          </View>

          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-600 text-sm text-center">
                {error}
              </Text>
            </View>
          ) : null}

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Email
            </Text>

            <View className="flex-row items-center border border-gray-300 rounded-xl px-4 bg-gray-50">
              <Mail size={20} color="#6b7280" />

              <TextInput
                className="flex-1 py-3.5 px-3 text-gray-900"
                placeholder="Masukkan email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Password
            </Text>

            <View className="flex-row items-center border border-gray-300 rounded-xl px-4 bg-gray-50">
              <Lock size={20} color="#6b7280" />

              <TextInput
                className="flex-1 py-3.5 px-3 text-gray-900"
                placeholder="Masukkan password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />

              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#6b7280" />
                ) : (
                  <Eye size={20} color="#6b7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className={`rounded-xl py-4 items-center ${
              loading ? "bg-blue-400" : "bg-blue-600"
            }`}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Masuk
              </Text>
            )}
          </TouchableOpacity>

          <Text className="text-center text-gray-400 text-sm mt-8">
            Hanya untuk cashier & owner
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}