import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  RefreshCw,
  Car,
  User,
} from "lucide-react-native";

import { useVehicles } from "@/hooks/useVehicles";
import { getCustomers } from "@/services/customer.service";
import type { Vehicle } from "@/types/vehicle";
import type { Customer } from "@/types/customer";
import { showSuccess, showError } from "@/utils/toast";

export default function VehiclesScreen() {
  const {
    vehicles,
    loading,
    refreshing,
    error,
    page,
    totalPages,
    total,
    fetchVehicles,
    addVehicle,
    editVehicle,
    removeVehicle,
  } = useVehicles();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  const [customerId, setCustomerId] = useState<number | null>(null);
  const [plateNumber, setPlateNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const isSearching = search.trim().length > 0;

  const loadCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true);

      const response = await getCustomers(1, 1000);
      const data = response.data?.data;

      setCustomers(data?.customers ?? data ?? []);
    } catch (err) {
      console.log("LOAD CUSTOMERS ERROR:", err);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCustomers();

      if (!isSearching) {
        fetchVehicles(1, false, 10);
      }
    }, [fetchVehicles, isSearching, loadCustomers]),
  );

  useEffect(() => {
    if (isSearching) {
      fetchVehicles(1, false, 1000);
      return;
    }

    fetchVehicles(1, false, 10);
  }, [isSearching, fetchVehicles]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();

    if (!q) return customers;

    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)),
    );
  }, [customers, customerSearch]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return vehicles;

    return vehicles.filter((v) => {
      const ownerName =
        v.customers?.name?.toLowerCase() ??
        customers
          .find((c) => c.id === v.customer_id)
          ?.name?.toLowerCase() ??
        "";

      return (
        v.plate_number.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        ownerName.includes(q) ||
        String(v.id).includes(q)
      );
    });
  }, [vehicles, search, customers]);

  const getOwnerName = (vehicle: Vehicle) => {
    return (
      vehicle.customers?.name ??
      customers.find((c) => c.id === vehicle.customer_id)?.name ??
      "Unknown"
    );
  };

  const openCreate = async () => {
    await loadCustomers();

    setEditing(null);
    setCustomerId(null);
    setPlateNumber("");
    setBrand("");
    setModel("");
    setCustomerSearch("");
    setModalOpen(true);
  };

  const openEdit = async (vehicle: Vehicle) => {
    await loadCustomers();

    setEditing(vehicle);
    setCustomerId(vehicle.customer_id);
    setPlateNumber(vehicle.plate_number);
    setBrand(vehicle.brand);
    setModel(vehicle.model);
    setCustomerSearch("");
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!customerId) {
      Alert.alert("Validasi", "Pilih customer terlebih dahulu");
      return;
    }

    if (!plateNumber.trim() || !brand.trim() || !model.trim()) {
      Alert.alert("Validasi", "Semua field wajib diisi");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        customer_id: customerId,
        plate_number: plateNumber.trim().toUpperCase(),
        brand: brand.trim(),
        model: model.trim(),
      };

      if (editing) {
        await editVehicle(editing.id, payload);
      } else {
        await addVehicle(payload);
      }

      setModalOpen(false);
    } catch (err: any) {
      Alert.alert(
        "Gagal",
        err?.response?.data?.message || "Gagal menyimpan vehicle",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (vehicle: Vehicle) => {
Alert.alert(
    "Hapus Vehicle?",
    `Hapus kendaraan ${vehicle.plate_number}?`,
    [
      {
        text: "Batal",
        style: "cancel",
      },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            await removeVehicle(vehicle.id);
            showSuccess("Vehicle berhasil dihapus");
          } catch (err: any) {
            showError(
              err?.response?.data?.message || "Gagal menghapus vehicle"
            );
          }
        },
      },
    ]
  );
  };

  return (
    <View className="flex-1 bg-gray-50 px-5 pt-[60px]">
      <View className="mb-5 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[28px] font-bold text-gray-900">
            Vehicles
          </Text>

          <Text className="mt-1 text-sm text-gray-500">
            {total} total vehicles
          </Text>
        </View>

        <Pressable
          onPress={() => fetchVehicles(page, true)}
          className="h-11 w-11 items-center justify-center rounded-full bg-white"
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#111827" />
          ) : (
            <RefreshCw size={20} color="#111827" />
          )}
        </Pressable>
      </View>

      <View className="mb-4 h-[50px] flex-row items-center rounded-xl border border-gray-200 bg-white px-[14px]">
        <Search size={20} color="#6B7280" />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search plate, brand, owner..."
          placeholderTextColor="#9CA3AF"
          className="ml-[10px] flex-1 text-[15px] text-gray-900"
        />

        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <X size={20} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-[100px]"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchVehicles(page, true)}
            tintColor="#111827"
          />
        }
      >
        {loading && !refreshing ? (
          <View className="items-center pt-20">
            <ActivityIndicator size="large" color="#111827" />
            <Text className="mt-4 text-sm text-gray-500">Loading...</Text>
          </View>
        ) : error ? (
          <View className="items-center px-5 pt-20">
            <Text className="text-lg font-semibold text-red-600">
              {error}
            </Text>

            <Pressable
              onPress={() => fetchVehicles(page)}
              className="mt-5 rounded-xl bg-gray-900 px-5 py-3"
            >
              <Text className="font-semibold text-white">Try Again</Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center pt-20">
            <Car size={40} color="#9CA3AF" />

            <Text className="mt-3 text-lg font-semibold text-gray-900">
              No vehicles found
            </Text>
          </View>
        ) : (
          filtered.map((vehicle) => (
            <View
              key={vehicle.id}
              className="mb-3 rounded-2xl border border-gray-200 bg-white p-4"
            >
              <View className="flex-row items-start">
                <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
                  <Car size={20} color="#111827" />
                </View>

                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-gray-900">
                    {vehicle.plate_number}
                  </Text>

                  <Text className="mt-0.5 text-sm text-gray-600">
                    {vehicle.brand} {vehicle.model}
                  </Text>

                  <View className="mt-2 flex-row items-center">
                    <User size={13} color="#9CA3AF" />

                    <Text className="ml-1 text-[13px] text-gray-500">
                      {getOwnerName(vehicle)}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => openEdit(vehicle)}
                  className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-gray-100"
                >
                  <Pencil size={16} color="#111827" />
                </Pressable>

                <Pressable
                  onPress={() => handleDelete(vehicle)}
                  className="h-9 w-9 items-center justify-center rounded-full bg-red-50"
                >
                  <Trash2 size={16} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          ))
        )}

        {totalPages > 1 && !isSearching && (
          <View className="mt-4 flex-row items-center justify-between">
            <Pressable
              disabled={page <= 1}
              onPress={() => fetchVehicles(page - 1)}
              className={`rounded-xl px-4 py-2.5 ${
                page <= 1 ? "bg-gray-200" : "bg-gray-900"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  page <= 1 ? "text-gray-500" : "text-white"
                }`}
              >
                Previous
              </Text>
            </Pressable>

            <Text className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </Text>

            <Pressable
              disabled={page >= totalPages}
              onPress={() => fetchVehicles(page + 1)}
              className={`rounded-xl px-4 py-2.5 ${
                page >= totalPages ? "bg-gray-200" : "bg-gray-900"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  page >= totalPages ? "text-gray-500" : "text-white"
                }`}
              >
                Next
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={openCreate}
        className="absolute bottom-5 right-5 h-14 w-14 items-center justify-center rounded-full bg-gray-900"
        style={{
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        }}
      >
        <Plus size={26} color="#FFFFFF" />
      </Pressable>

      <Modal visible={modalOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[85%] rounded-t-3xl bg-white px-5 pb-10 pt-6">
            <Text className="mb-5 text-xl font-bold text-gray-900">
              {editing ? "Edit Vehicle" : "Add Vehicle"}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="mb-2 text-sm font-medium text-gray-700">
                Customer
              </Text>

              <View className="mb-3 h-11 flex-row items-center rounded-xl border border-gray-200 px-3">
                <Search size={16} color="#9CA3AF" />

                <TextInput
                  value={customerSearch}
                  onChangeText={setCustomerSearch}
                  placeholder="Cari customer..."
                  placeholderTextColor="#9CA3AF"
                  className="ml-2 flex-1 text-sm text-gray-900"
                />
              </View>

              <View className="mb-4 max-h-36 overflow-hidden rounded-xl border border-gray-200">
                {loadingCustomers ? (
                  <View className="items-center py-6">
                    <ActivityIndicator size="small" color="#111827" />
                  </View>
                ) : filteredCustomers.length === 0 ? (
                  <View className="items-center py-6">
                    <Text className="text-sm text-gray-500">
                      Tidak ada customer
                    </Text>
                  </View>
                ) : (
                  <ScrollView nestedScrollEnabled>
                    {filteredCustomers.map((c) => (
                      <Pressable
                        key={c.id}
                        onPress={() => setCustomerId(c.id)}
                        className={`border-b border-gray-100 px-4 py-3 ${
                          customerId === c.id ? "bg-gray-100" : ""
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            customerId === c.id
                              ? "font-bold text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          {c.name}
                          {c.phone ? ` — ${c.phone}` : ""}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>

              <Text className="mb-2 text-sm font-medium text-gray-700">
                Plate Number
              </Text>

              <TextInput
                value={plateNumber}
                onChangeText={(t) => setPlateNumber(t.toUpperCase())}
                placeholder="B 1234 ABC"
                placeholderTextColor="#9CA3AF"
                className="mb-4 h-12 rounded-xl border border-gray-200 px-4 text-sm text-gray-900"
                autoCapitalize="characters"
              />

              <Text className="mb-2 text-sm font-medium text-gray-700">
                Brand
              </Text>

              <TextInput
                value={brand}
                onChangeText={setBrand}
                placeholder="Toyota"
                placeholderTextColor="#9CA3AF"
                className="mb-4 h-12 rounded-xl border border-gray-200 px-4 text-sm text-gray-900"
              />

              <Text className="mb-2 text-sm font-medium text-gray-700">
                Model
              </Text>

              <TextInput
                value={model}
                onChangeText={setModel}
                placeholder="Avanza"
                placeholderTextColor="#9CA3AF"
                className="mb-6 h-12 rounded-xl border border-gray-200 px-4 text-sm text-gray-900"
              />
            </ScrollView>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setModalOpen(false)}
                className="h-12 flex-1 items-center justify-center rounded-xl border border-gray-200"
              >
                <Text className="font-semibold text-gray-900">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit}
                disabled={submitting}
                className="h-12 flex-1 items-center justify-center rounded-xl bg-gray-900"
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-semibold text-white">
                    {editing ? "Update" : "Save"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}