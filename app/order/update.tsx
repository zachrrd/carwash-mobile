import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
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

import { useOrder } from "@/hooks/useOrder";
import { useUpdateOrder } from "@/hooks/useUpdateOrder";
import { getCustomers } from "@/services/customer.service";
import { getVehicles } from "@/services/vehicle.service";
import { getServices } from "@/services/service.service";
import { getStaffs } from "@/services/staff.service";

import type { Customer } from "@/types/customer";
import type { Vehicle } from "@/types/vehicle";
import type { Service } from "@/types/service";
import type { Staff } from "@/types/staff";
import type { OrderStatus } from "@/types/order";

import { showSuccess, showError } from "@/utils/toast";

type OrderItemForm = {
  service_id: number;
  qty: number;
};

const formatRupiah = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

export default function UpdateOrderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const { order, loading: orderLoading, error: orderError } = useOrder(id);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

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

  if (orderLoading || loadingMaster) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#111827" />
        <Text className="mt-4 text-sm text-gray-500">Loading...</Text>
      </View>
    );
  }

  if (orderError || !order) {
    return (
      <View className="flex-1 bg-gray-50">
        <View
          className="flex-row items-center justify-between border-b border-gray-200 bg-white px-5"
          style={{ paddingTop: insets.top + 10, paddingBottom: 12 }}
        >
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full"
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">Edit Order</Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-xl font-bold text-gray-900">
            Order tidak ditemukan
          </Text>
          <Pressable
            className="mt-6 h-12 items-center justify-center rounded-xl bg-gray-900 px-6"
            onPress={() => router.back()}
          >
            <Text className="text-sm font-bold text-white">Kembali</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isPaid = (order.payment_status ?? "").toUpperCase() === "PAID";
  const currentStatus = (order.service_status ?? "").toUpperCase();

  if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
    return (
      <View className="flex-1 bg-gray-50">
        <View
          className="flex-row items-center justify-between border-b border-gray-200 bg-white px-5"
          style={{ paddingTop: insets.top + 10, paddingBottom: 12 }}
        >
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full"
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">Edit Order</Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-xl font-bold text-gray-900">
            Order tidak dapat diubah
          </Text>
          <Text className="mt-2 text-center text-sm text-gray-500">
            Order dengan status {currentStatus} sudah final dan tidak dapat
            diubah lagi.
          </Text>
          <Pressable
            className="mt-6 h-12 items-center justify-center rounded-xl bg-gray-900 px-6"
            onPress={() => router.back()}
          >
            <Text className="text-sm font-bold text-white">Kembali</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (isPaid) {
    return (
      <View className="flex-1 bg-gray-50">
        <View
          className="flex-row items-center justify-between border-b border-gray-200 bg-white px-5"
          style={{ paddingTop: insets.top + 10, paddingBottom: 12 }}
        >
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full"
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">Edit Order</Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-xl font-bold text-gray-900">
            Order sudah dibayar
          </Text>
          <Text className="mt-2 text-center text-sm text-gray-500">
            Order yang sudah dibayar tidak dapat mengubah customer, kendaraan,
            atau layanan. Silakan ubah penugasan staff langsung di detail order.
          </Text>
          <Pressable
            className="mt-6 h-12 items-center justify-center rounded-xl bg-gray-900 px-6"
            onPress={() => router.back()}
          >
            <Text className="text-sm font-bold text-white">Kembali</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <OrderForm
      key={order.id}
      order={order}
      customers={customers}
      vehicles={vehicles}
      services={services}
      staffs={staffs}
      orderId={Number(id)}
    />
  );
}

type OrderFormProps = {
  order: any;
  customers: Customer[];
  vehicles: Vehicle[];
  services: Service[];
  staffs: Staff[];
  orderId: number;
};

function OrderForm({
  order,
  customers,
  vehicles,
  services,
  staffs,
  orderId,
}: OrderFormProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { update, loading: updating, error: updateError } = useUpdateOrder();

  const [customerId, setCustomerId] = useState<number | null>(
    order.customer_id ?? null,
  );
  const [vehicleId, setVehicleId] = useState<number | null>(
    order.vehicle_id ?? null,
  );
  const [staffId, setStaffId] = useState<number | null>(order.staff_id ?? null);
  const [checkInTime, setCheckInTime] = useState(order.check_in_time ?? "");
  const [items, setItems] = useState<OrderItemForm[]>(
    order.order_items?.map((item: any) => ({
      service_id: Number(item.service_id),
      qty: Number(item.qty ?? 1),
    })) ?? [],
  );
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  // Time Picker
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(() => {
    if (order.check_in_time) {
      const [hours, minutes] = order.check_in_time.split(":").map(Number);
      const date = new Date();
      date.setHours(hours || 0, minutes || 0, 0, 0);
      return date;
    }
    return new Date();
  });

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const keyword = customerSearch.toLowerCase();
    return customers.filter((customer) =>
      customer.name?.toLowerCase().includes(keyword),
    );
  }, [customers, customerSearch]);

  const availableVehicles = useMemo(() => {
    if (!customerId) return [];
    return vehicles.filter((vehicle) => vehicle.customer_id === customerId);
  }, [vehicles, customerId]);

  const activeStaffs = useMemo(
    () =>
      staffs.filter(
        (staff) =>
          !staff.status ||
          staff.status.toUpperCase() === "ACTIVE" ||
          staff.status === "Active",
      ),
    [staffs],
  );

  const activeServices = useMemo(
    () =>
      services.filter(
        (service) =>
          !service.status ||
          service.status.toUpperCase() === "ACTIVE" ||
          service.status === "Active",
      ),
    [services],
  );

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const service = services.find(
        (service) => service.id === item.service_id,
      );
      if (!service) return sum;
      return sum + Number(service.price) * item.qty;
    }, 0);
  }, [items, services]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === customerId),
    [customers, customerId],
  );

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === vehicleId),
    [vehicles, vehicleId],
  );

  const handleCustomerChange = (newId: number) => {
    setCustomerId(newId);
    const firstVehicle = vehicles.find(
      (vehicle) => vehicle.customer_id === newId,
    );
    setVehicleId(firstVehicle?.id ?? null);
    setCustomerSearch("");
  };

  const handleAddService = () => {
    if (!selectedServiceId) return;
    const serviceId = Number(selectedServiceId);
    const existingItem = items.find((item) => item.service_id === serviceId);

    if (existingItem) {
      setItems((previous) =>
        previous.map((item) =>
          item.service_id === serviceId ? { ...item, qty: item.qty + 1 } : item,
        ),
      );
    } else {
      setItems((previous) => [...previous, { service_id: serviceId, qty: 1 }]);
    }
    setSelectedServiceId("");
  };

  const updateQty = (serviceId: number, amount: number) => {
    setItems((previous) =>
      previous.map((item) => {
        if (item.service_id !== serviceId) return item;
        return { ...item, qty: Math.max(1, item.qty + amount) };
      }),
    );
  };

  const removeService = (serviceId: number) => {
    setItems((previous) =>
      previous.filter((item) => item.service_id !== serviceId),
    );
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
    if (!order || !orderId) return;
    if (order.payment_status === "Paid") return;
    if (!customerId || !vehicleId) return;
    if (items.length === 0) return;
    if (!checkInTime) return;

    try {
      await update(orderId, {
        customer_id: customerId,
        vehicle_id: vehicleId,
        staff_id: staffId,
        check_in_time: checkInTime,
        items: items.map((item) => ({
          service_id: item.service_id,
          qty: item.qty,
        })),
      });

      showSuccess("Order berhasil di update");
      router.back();
    } catch (err: any) {
      console.error("UPDATE ORDER ERROR:", err);
      showError(
        err?.response?.data?.message || "Gagal mengupdate order. Coba lagi.",
      );
    }
  };

  const isFormValid =
    !!customerId && !!vehicleId && items.length > 0 && !!checkInTime;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        className="flex-row items-center justify-between border-b border-gray-200 bg-white px-5"
        style={{ paddingTop: insets.top + 10, paddingBottom: 12 }}
      >
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full"
          onPress={() => router.back()}
          disabled={updating}
        >
          <ArrowLeft size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Edit Order</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        {/* Order ID */}
        <View className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
          <Text className="text-xs text-gray-500">Order ID</Text>
          <Text className="mt-1 text-xl font-bold text-gray-900">
            #{order.id}
          </Text>
        </View>

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
                filteredCustomers.map((customer) => (
                  <Pressable
                    key={customer.id}
                    className={`border-b border-gray-100 px-4 py-3.5 ${
                      customerId === customer.id ? "bg-gray-100" : ""
                    }`}
                    onPress={() => handleCustomerChange(customer.id)}
                  >
                    <Text
                      className={`text-sm ${
                        customerId === customer.id
                          ? "font-bold text-gray-900"
                          : "text-gray-700"
                      }`}
                    >
                      {customer.name}
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
              availableVehicles.map((vehicle) => (
                <Pressable
                  key={vehicle.id}
                  className={`border-b border-gray-100 px-4 py-3.5 ${
                    vehicleId === vehicle.id ? "bg-gray-100" : ""
                  }`}
                  onPress={() => setVehicleId(vehicle.id)}
                >
                  <Text
                    className={`text-sm ${
                      vehicleId === vehicle.id
                        ? "font-bold text-gray-900"
                        : "text-gray-700"
                    }`}
                  >
                    {vehicle.plate_number} - {vehicle.brand} {vehicle.model}
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

            {activeStaffs.map((staff) => (
              <Pressable
                key={staff.id}
                className={`border-b border-gray-100 px-4 py-3.5 ${
                  staffId === staff.id ? "bg-gray-100" : ""
                }`}
                onPress={() => setStaffId(staff.id)}
              >
                <Text
                  className={`text-sm ${
                    staffId === staff.id
                      ? "font-bold text-gray-900"
                      : "text-gray-700"
                  }`}
                >
                  {staff.name}
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
              .filter(
                (service) =>
                  !items.some((item) => item.service_id === service.id),
              )
              .map((service) => (
                <Pressable
                  key={service.id}
                  className={`border-b border-gray-100 px-4 py-3.5 ${
                    selectedServiceId === String(service.id)
                      ? "bg-gray-100"
                      : ""
                  }`}
                  onPress={() => setSelectedServiceId(String(service.id))}
                >
                  <Text className="text-sm text-gray-700">
                    {service.name} — {formatRupiah(Number(service.price))}
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
            const service = services.find(
              (service) => service.id === item.service_id,
            );
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

                <Text className="mr-2 w-[72px] text-right text-sm font-semibold">
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

        {updateError ? (
          <Text className="mb-4 text-center text-sm text-red-500">
            {updateError}
          </Text>
        ) : null}

        {/* Submit Button */}
        <Pressable
          className={`h-14 items-center justify-center rounded-2xl ${
            updating || !isFormValid ? "bg-gray-400" : "bg-gray-900"
          }`}
          onPress={handleSubmit}
          disabled={updating || !isFormValid}
        >
          {updating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-bold text-white">Update Order</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
