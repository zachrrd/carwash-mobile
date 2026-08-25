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
  Phone,
  Users,
} from "lucide-react-native";

import { useCustomers } from "@/hooks/useCustomers";
import type { Customer } from "@/types/customer";

export default function CustomersScreen() {
  const {
    customers,
    loading,
    refreshing,
    error,
    page,
    totalPages,
    total,
    fetchCustomers,
    addCustomer,
    editCustomer,
    removeCustomer,
  } = useCustomers();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSearching = search.trim().length > 0;

  useFocusEffect(
    useCallback(() => {
      if (!isSearching) {
        fetchCustomers(1, false, 10);
      }
    }, [fetchCustomers, isSearching]),
  );

  useEffect(() => {
    const loadCustomers = async () => {
      if (isSearching) {
        await fetchCustomers(1, false, 1000);
      } else {
        await fetchCustomers(page, false, 10);
      }
    };

    loadCustomers();
  }, [search, fetchCustomers, isSearching, page]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return customers;

    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        String(c.id).includes(q),
    );
  }, [customers, search]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setPhone("");
    setModalOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setName(customer.name);
    setPhone(customer.phone ?? "");
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Validasi", "Nama customer wajib diisi");
      return;
    }

    try {
      setSubmitting(true);

      if (editing) {
        await editCustomer(editing.id, {
          name: name.trim(),
          phone: phone.trim() || undefined,
        });
      } else {
        await addCustomer({
          name: name.trim(),
          phone: phone.trim() || undefined,
        });
      }

      setModalOpen(false);
    } catch (err: any) {
      Alert.alert(
        "Gagal",
        err?.response?.data?.message || "Gagal menyimpan customer",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (customer: Customer) => {
    Alert.alert(
      "Hapus Customer?",
      `Hapus "${customer.name}"? Tindakan ini tidak bisa dibatalkan.`,
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
              await removeCustomer(customer.id);
            } catch (err: any) {
              Alert.alert(
                "Gagal",
                err?.response?.data?.message || "Gagal menghapus customer",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-gray-50 px-5 pt-[60px]">
      <View className="mb-5 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[28px] font-bold text-gray-900">Customers</Text>

          <Text className="mt-1 text-sm text-gray-500">
            {total} total customers
          </Text>
        </View>

        <Pressable
          onPress={() => fetchCustomers(page, true, isSearching ? 1000 : 10)}
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
          placeholder="Search name, phone..."
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
            onRefresh={() =>
              fetchCustomers(page, true, isSearching ? 1000 : 10)
            }
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
            <Text className="text-lg font-semibold text-red-600">{error}</Text>

            <Pressable
              onPress={() => fetchCustomers(page)}
              className="mt-5 rounded-xl bg-gray-900 px-5 py-3"
            >
              <Text className="font-semibold text-white">Try Again</Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center pt-20">
            <Users size={40} color="#9CA3AF" />

            <Text className="mt-3 text-lg font-semibold text-gray-900">
              No customers found
            </Text>
          </View>
        ) : (
          filtered.map((customer) => (
            <View
              key={customer.id}
              className="mb-3 rounded-2xl border border-gray-200 bg-white p-4"
            >
              <View className="flex-row items-center">
                <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                  <Text className="text-base font-bold text-gray-900">
                    {customer.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-gray-900">
                    {customer.name}
                  </Text>

                  <View className="mt-1 flex-row items-center">
                    <Phone size={13} color="#9CA3AF" />

                    <Text className="ml-1 text-[13px] text-gray-500">
                      {customer.phone || "No phone"}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => openEdit(customer)}
                  className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-gray-100"
                >
                  <Pencil size={16} color="#111827" />
                </Pressable>

                <Pressable
                  onPress={() => handleDelete(customer)}
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
              onPress={() => fetchCustomers(page - 1, false, 10)}
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
              onPress={() => fetchCustomers(page + 1, false, 10)}
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
          shadowOffset: {
            width: 0,
            height: 3,
          },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        }}
      >
        <Plus size={26} color="#FFFFFF" />
      </Pressable>

      <Modal visible={modalOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-white px-5 pb-10 pt-6">
            <Text className="mb-5 text-xl font-bold text-gray-900">
              {editing ? "Edit Customer" : "Add Customer"}
            </Text>

            <Text className="mb-2 text-sm font-medium text-gray-700">Name</Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Customer name"
              placeholderTextColor="#9CA3AF"
              className="mb-4 h-12 rounded-xl border border-gray-200 px-4 text-sm text-gray-900"
            />

            <Text className="mb-2 text-sm font-medium text-gray-700">
              Phone
            </Text>

            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="08xxxxxxxxxx"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              className="mb-6 h-12 rounded-xl border border-gray-200 px-4 text-sm text-gray-900"
            />

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
