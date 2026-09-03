import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Check,
  Search,
  Clock,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCreateOrder } from "@/hooks/useCreateOrder";
import { getCustomers } from "@/services/customer.service";
import { getVehicles } from "@/services/vehicle.service";
import { getServices } from "@/services/service.service";
import { getStaffs } from "@/services/staff.service";

import type {
  Customer,
  Vehicle,
  Staff,
  Service,
  OrderStatus,
} from "@/types/order";

import { showSuccess, showError } from "@/utils/toast";

type OrderItemForm = {
  service_id: number;
  qty: number;
};

const formatRupiah = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

export default function CreateOrderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { create, loading: submitting, error: submitError } = useCreateOrder();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  // Form state
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [staffId, setStaffId] = useState<number | null>(null);
  const [checkInTime, setCheckInTime] = useState("");
  const [items, setItems] = useState<OrderItemForm[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  // Time Picker
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingMaster(true);
        const [custRes, vehRes, servRes, staffRes] = await Promise.all([
          getCustomers(1, 100),
          getVehicles(1, 100),
          getServices(1, 100),
          getStaffs(1, 100),
        ]);

        setCustomers(custRes.data?.data?.customers ?? custRes.data?.data ?? []);
        setVehicles(vehRes.data?.data?.vehicles ?? vehRes.data?.data ?? []);
        setServices(servRes.data?.data?.services ?? servRes.data?.data ?? []);
        setStaffs(staffRes.data?.data?.staffs ?? staffRes.data?.data ?? []);
      } catch (err) {
        console.log("LOAD MASTER ERROR:", err);
      } finally {
        setLoadingMaster(false);
      }
    };

    load();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const keyword = customerSearch.toLowerCase();
    return customers.filter((c) => c.name?.toLowerCase().includes(keyword));
  }, [customers, customerSearch]);

  const availableVehicles = useMemo(() => {
    if (!customerId) return [];
    return vehicles.filter((v) => v.customer_id === customerId);
  }, [vehicles, customerId]);

  const activeStaffs = useMemo(
    () =>
      staffs.filter(
        (s) =>
          !s.status ||
          s.status.toUpperCase() === "ACTIVE" ||
          s.status === "Active",
      ),
    [staffs],
  );

  const activeServices = useMemo(
    () =>
      services.filter(
        (s) =>
          !s.status ||
          s.status.toUpperCase() === "ACTIVE" ||
          s.status === "Active",
      ),
    [services],
  );

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const service = services.find((s) => s.id === item.service_id);
      if (!service) return sum;
      return sum + Number(service.price) * item.qty;
    }, 0);
  }, [items, services]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId],
  );

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId),
    [vehicles, vehicleId],
  );

  const handleCustomerChange = (newId: number) => {
    setCustomerId(newId);
    const first = vehicles.find((v) => v.customer_id === newId);
    setVehicleId(first?.id ?? null);
    setCustomerSearch("");
  };

  const handleAddService = () => {
    if (!selectedServiceId) return;
    const sid = Number(selectedServiceId);

    const exist = items.find((i) => i.service_id === sid);
    if (exist) {
      setItems((prev) =>
        prev.map((i) => (i.service_id === sid ? { ...i, qty: i.qty + 1 } : i)),
      );
    } else {
      setItems((prev) => [...prev, { service_id: sid, qty: 1 }]);
    }
    setSelectedServiceId("");
  };

  const updateQty = (serviceId: number, amount: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.service_id !== serviceId) return i;
        return { ...i, qty: Math.max(1, i.qty + amount) };
      }),
    );
  };

  const removeService = (serviceId: number) => {
    setItems((prev) => prev.filter((i) => i.service_id !== serviceId));
  };

  const onTimeChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (selectedDate) {
      setTempTime(selectedDate);
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      setCheckInTime(`${hours}:${minutes}`);
    }
  };

  const handleSubmit = async () => {
    if (!customerId || !vehicleId) return;
    if (items.length === 0) return;
    if (!checkInTime) return;

    try {
      const result = await create({
        customer_id: customerId,
        vehicle_id: vehicleId,
        staff_id: staffId,
        check_in_time: checkInTime,
        items: items.map((i) => ({
          service_id: i.service_id,
          qty: i.qty,
        })),
      });

      showSuccess("Order berhasil dibuat");

      setTimeout(() => {
        router.replace({
          pathname: "/order/success",
          params: {
            orderId: String(result?.id ?? ""),
          },
        });
      }, 800);
    } catch (err: any) {
      console.error(err);
      showError(
        err?.response?.data?.message || "Gagal membuat order. Coba lagi.",
      );
    }
  };

  if (loadingMaster) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#111827" />
        <Text className="mt-4 text-sm text-gray-500">Loading...</Text>
      </View>
    );
  }

  const isFormValid =
    !!customerId && !!vehicleId && items.length > 0 && !!checkInTime;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header dengan Safe Area */}
      <View
        className="flex-row items-center justify-between border-b border-gray-200 bg-white px-5"
        style={{ paddingTop: insets.top + 10, paddingBottom: 12 }}
      >
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full"
          onPress={() => router.back()}
          disabled={submitting}
        >
          <ArrowLeft size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Create Order</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        {/* ========== CUSTOMER ========== */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-900">
            Customer
          </Text>

          {selectedCustomer && (
            <View className="mb-3 rounded-xl border border-gray-900 bg-gray-100 px-4 py-3">
              <Text className="text-xs text-gray-500">Sedang dipilih</Text>
              <Text className="mt-0.5 text-sm font-bold text-gray-900">
                {selectedCustomer.name}
              </Text>
            </View>
          )}

          <View className="mb-3 flex-row items-center rounded-xl border border-gray-200 bg-white px-3">
            <Search size={18} color="#9ca3af" />
            <TextInput
              className="ml-2 h-12 flex-1 text-sm text-gray-900"
              placeholder="Cari customer..."
              placeholderTextColor="#9ca3af"
              value={customerSearch}
              onChangeText={setCustomerSearch}
            />
          </View>

          <View className="max-h-52 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <ScrollView nestedScrollEnabled>
              {filteredCustomers.length === 0 ? (
                <Text className="px-4 py-3.5 text-sm text-gray-500">
                  Tidak ada customer ditemukan
                </Text>
              ) : (
                filteredCustomers.map((c) => (
                  <Pressable
                    key={c.id}
                    className={`border-b border-gray-100 px-4 py-3.5 ${
                      customerId === c.id ? "bg-gray-100" : ""
                    }`}
                    onPress={() => handleCustomerChange(c.id)}
                  >
                    <Text
                      className={`text-sm ${
                        customerId === c.id
                          ? "font-bold text-gray-900"
                          : "text-gray-700"
                      }`}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>

        {/* ========== VEHICLE ========== */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-900">
            Vehicle
          </Text>

          {selectedVehicle && (
            <View className="mb-3 rounded-xl border border-gray-900 bg-gray-100 px-4 py-3">
              <Text className="text-xs text-gray-500">Sedang dipilih</Text>
              <Text className="mt-0.5 text-sm font-bold text-gray-900">
                {selectedVehicle.plate_number} - {selectedVehicle.brand}{" "}
                {selectedVehicle.model}
              </Text>
            </View>
          )}

          <View className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {availableVehicles.length === 0 ? (
              <Text className="px-4 py-3.5 text-sm text-gray-500">
                {customerId
                  ? "Tidak ada kendaraan untuk customer ini"
                  : "Pilih customer terlebih dahulu"}
              </Text>
            ) : (
              availableVehicles.map((v) => (
                <Pressable
                  key={v.id}
                  className={`border-b border-gray-100 px-4 py-3.5 ${
                    vehicleId === v.id ? "bg-gray-100" : ""
                  }`}
                  onPress={() => setVehicleId(v.id)}
                >
                  <Text
                    className={`text-sm ${
                      vehicleId === v.id
                        ? "font-bold text-gray-900"
                        : "text-gray-700"
                    }`}
                  >
                    {v.plate_number} - {v.brand} {v.model}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        </View>

        {/* ========== STAFF ========== */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-900">
            Staff
          </Text>
          <View className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <Pressable
              className={`border-b border-gray-100 px-4 py-3.5 ${
                staffId === null ? "bg-gray-100" : ""
              }`}
              onPress={() => setStaffId(null)}
            >
              <Text
                className={`text-sm ${
                  staffId === null ? "font-bold text-gray-900" : "text-gray-700"
                }`}
              >
                No staff assigned
              </Text>
            </Pressable>

            {activeStaffs.map((s) => (
              <Pressable
                key={s.id}
                className={`border-b border-gray-100 px-4 py-3.5 ${
                  staffId === s.id ? "bg-gray-100" : ""
                }`}
                onPress={() => setStaffId(s.id)}
              >
                <Text
                  className={`text-sm ${
                    staffId === s.id
                      ? "font-bold text-gray-900"
                      : "text-gray-700"
                  }`}
                >
                  {s.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ========== SERVICES ========== */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-900">
            Services
          </Text>

          <View className="mb-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {activeServices
              .filter((s) => !items.some((i) => i.service_id === s.id))
              .map((s) => (
                <Pressable
                  key={s.id}
                  className={`border-b border-gray-100 px-4 py-3.5 ${
                    selectedServiceId === String(s.id) ? "bg-gray-100" : ""
                  }`}
                  onPress={() => setSelectedServiceId(String(s.id))}
                >
                  <Text className="text-sm text-gray-700">
                    {s.name} — {formatRupiah(Number(s.price))}
                  </Text>
                </Pressable>
              ))}
          </View>

          <Pressable
            className={`mb-4 h-11 flex-row items-center justify-center rounded-xl ${
              selectedServiceId ? "bg-gray-900" : "bg-gray-400"
            }`}
            onPress={handleAddService}
            disabled={!selectedServiceId}
          >
            <Plus size={18} color="#fff" />
            <Text className="ml-2 text-sm font-semibold text-white">
              Tambah Service
            </Text>
          </Pressable>

          {items.map((item) => {
            const service = services.find((s) => s.id === item.service_id);
            if (!service) return null;
            const subtotal = Number(service.price) * item.qty;

            return (
              <View
                key={item.service_id}
                className="mb-2.5 flex-row items-center rounded-xl border border-gray-200 bg-white p-3"
              >
                <View className="flex-1 pr-2">
                  <Text className="text-sm font-semibold text-gray-900">
                    {service.name}
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-500">
                    {formatRupiah(Number(service.price))} / service
                  </Text>
                </View>

                <View className="mr-2 flex-row items-center rounded-lg border border-gray-200">
                  <Pressable
                    className="h-8 w-8 items-center justify-center"
                    onPress={() => updateQty(item.service_id, -1)}
                  >
                    <Minus size={14} color="#111827" />
                  </Pressable>
                  <Text className="w-7 text-center text-sm font-medium">
                    {item.qty}
                  </Text>
                  <Pressable
                    className="h-8 w-8 items-center justify-center"
                    onPress={() => updateQty(item.service_id, 1)}
                  >
                    <Plus size={14} color="#111827" />
                  </Pressable>
                </View>

                <Text className="mr-2 w-18 text-right text-sm font-semibold">
                  {formatRupiah(subtotal)}
                </Text>

                <Pressable onPress={() => removeService(item.service_id)}>
                  <Trash2 size={18} color="#ef4444" />
                </Pressable>
              </View>
            );
          })}

          <View className="mt-3 flex-row items-center justify-between border-t border-gray-200 pt-3">
            <Text className="font-semibold text-gray-900">Total</Text>
            <Text className="text-xl font-bold text-gray-900">
              {formatRupiah(total)}
            </Text>
          </View>
        </View>

        {/* ========== STATUS INFO ========== */}
        <View className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <Text className="text-xs font-semibold text-blue-800">
            Status Awal Pesanan
          </Text>
          <Text className="mt-1 text-sm text-blue-900 font-bold">
            WAITING (Menunggu Konfirmasi)
          </Text>
          <Text className="mt-1 text-xs text-blue-700">
            Setelah order dibuat, order dapat dikonfirmasi dan diproses
            pembayarannya pada halaman detail order.
          </Text>
        </View>

        {/* ========== CHECK IN TIME (Time Picker) ========== */}
        <View className="mb-6">
          <Text className="mb-2 text-sm font-semibold text-gray-900">
            Check In Time <Text className="text-red-500">*</Text>
          </Text>

          <Pressable
            onPress={() => setShowTimePicker(true)}
            className="h-12 flex-row items-center rounded-xl border border-gray-200 bg-white px-4"
          >
            <Clock size={18} color="#6B7280" />
            <Text
              className={`ml-3 text-sm ${
                checkInTime ? "font-medium text-gray-900" : "text-gray-400"
              }`}
            >
              {checkInTime || "Pilih jam check-in"}
            </Text>
          </Pressable>

          {showTimePicker && (
            <DateTimePicker
              value={tempTime}
              mode="time"
              is24Hour={true}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onTimeChange}
            />
          )}

          {Platform.OS === "ios" && showTimePicker && (
            <Pressable
              onPress={() => setShowTimePicker(false)}
              className="mt-2 items-center rounded-xl bg-gray-900 py-2.5"
            >
              <Text className="font-semibold text-white">Selesai</Text>
            </Pressable>
          )}
        </View>

        {submitError ? (
          <Text className="mb-4 text-center text-sm text-red-500">
            {submitError}
          </Text>
        ) : null}

        {/* Submit */}
        <Pressable
          className={`h-14 items-center justify-center rounded-2xl ${
            submitting || !isFormValid ? "bg-gray-400" : "bg-gray-900"
          }`}
          onPress={handleSubmit}
          disabled={submitting || !isFormValid}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-bold text-white">Create Order</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
