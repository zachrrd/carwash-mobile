import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { RefreshCw, Search, X } from "lucide-react-native";

import { getOrders } from "@/services/order.service";
import type { Order } from "@/types/order";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";

const serviceFilters = [
  { key: "ALL", label: "All" },
  { key: "WAITING", label: "Waiting" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
] as const;

const paymentFilters = [
  { key: "ALL", label: "All" },
  { key: "PAID", label: "Paid" },
  { key: "UNPAID", label: "Unpaid" },
  { key: "REFUNDED", label: "Refunded" },
] as const;

type ServiceFilterKey = (typeof serviceFilters)[number]["key"];
type PaymentFilterKey = (typeof paymentFilters)[number]["key"];

export default function HistoryScreen() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<ServiceFilterKey>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterKey>("ALL");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isSearching = search.trim().length > 0;

  const fetchOrders = useCallback(
    async (pageNum = 1, isRefresh = false, limit = 15) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await getOrders(pageNum, limit);
        const data = response.data?.data;

        const list = data?.data ?? data?.orders ?? [];

        setOrders(Array.isArray(list) ? list : []);
        setTotalPages(data?.pagination?.totalPages ?? 1);
        setPage(pageNum);
      } catch (err: any) {
        console.log("GET HISTORY ERROR:", err);
        setError(err?.response?.data?.message || "Gagal memuat riwayat order");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      fetchOrders(1, false, 15);
    }, [fetchOrders]),
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return orders.filter((order) => {
      const currentService = (order.service_status ?? "WAITING").toUpperCase();
      const currentPayment = (order.payment_status ?? "UNPAID").toUpperCase();

      const matchesService =
        serviceFilter === "ALL" || currentService === serviceFilter;

      const matchesPayment =
        paymentFilter === "ALL" || currentPayment === paymentFilter;

      const customerName = order.customers?.name?.toLowerCase() ?? "";
      const plate = order.vehicles?.plate_number?.toLowerCase() ?? "";
      const vehicleModel = order.vehicles
        ? `${order.vehicles.brand} ${order.vehicles.model}`.toLowerCase()
        : "";
      const orderId = String(order.id);

      const matchesSearch =
        q.length === 0 ||
        customerName.includes(q) ||
        plate.includes(q) ||
        vehicleModel.includes(q) ||
        orderId.includes(q);

      return matchesService && matchesPayment && matchesSearch;
    });
  }, [orders, search, serviceFilter, paymentFilter]);

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getTotal = (order: Order) =>
    order.order_items?.reduce(
      (sum, item) => sum + Number(item.subtotal ?? 0),
      0,
    ) ?? 0;

  const Chip = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      className={`mr-2 min-w-[75px] items-center justify-center rounded-full border px-4 py-2.5 ${
        active ? "border-gray-900 bg-gray-900" : "border-gray-300 bg-white"
      }`}
    >
      <Text
        className={`text-[13px] font-semibold ${
          active ? "text-white" : "text-gray-700"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-50 px-5 pt-[60px]">
      {/* Header */}
      <View className="mb-5 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[28px] font-bold text-gray-900">Riwayat</Text>
          <Text className="mt-1 text-sm text-gray-500">
            Riwayat seluruh order dan pembayaran
          </Text>
        </View>

        <Pressable
          onPress={() =>
            fetchOrders(isSearching ? 1 : page, true, isSearching ? 1000 : 15)
          }
          className="h-11 w-11 items-center justify-center rounded-full bg-white border border-gray-200"
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#111827" />
          ) : (
            <RefreshCw size={20} color="#111827" />
          )}
        </Pressable>
      </View>

      {/* Search Bar */}
      <View className="mb-3 h-[50px] flex-row items-center rounded-xl border border-gray-200 bg-white px-[14px]">
        <Search size={20} color="#6B7280" />
        <TextInput
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            if (text.trim().length > 0) {
              fetchOrders(1, false, 1000);
            } else {
              fetchOrders(1, false, 15);
            }
          }}
          placeholder="Cari ID, customer, plat nomor..."
          placeholderTextColor="#9CA3AF"
          className="ml-[10px] flex-1 text-[15px] text-gray-900"
        />

        {search.length > 0 && (
          <Pressable
            onPress={() => {
              setSearch("");
              fetchOrders(1, false, 15);
            }}
          >
            <X size={20} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      {/* Service filters */}
      <View className="mb-3">
        <Text className="mb-2 text-xs font-semibold text-gray-600">
          Status Layanan
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="flex-row pr-5"
        >
          {serviceFilters.map((filter) => (
            <Chip
              key={filter.key}
              label={filter.label}
              active={serviceFilter === filter.key}
              onPress={() => setServiceFilter(filter.key)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Payment filters */}
      <View className="mb-4">
        <Text className="mb-2 text-xs font-semibold text-gray-600">
          Status Pembayaran
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="flex-row pr-5"
        >
          {paymentFilters.map((filter) => (
            <Chip
              key={filter.key}
              label={filter.label}
              active={paymentFilter === filter.key}
              onPress={() => setPaymentFilter(filter.key)}
            />
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              fetchOrders(isSearching ? 1 : page, true, isSearching ? 1000 : 15)
            }
            tintColor="#111827"
          />
        }
      >
        {loading && !refreshing ? (
          <View className="items-center pt-20">
            <ActivityIndicator size="large" color="#111827" />
            <Text className="mt-4 text-sm text-gray-500">Memuat...</Text>
          </View>
        ) : error ? (
          <View className="items-center px-5 pt-20">
            <Text className="text-lg font-semibold text-red-600">{error}</Text>
            <Pressable
              onPress={() =>
                fetchOrders(
                  isSearching ? 1 : page,
                  false,
                  isSearching ? 1000 : 15,
                )
              }
              className="mt-5 rounded-xl bg-gray-900 px-5 py-3"
            >
              <Text className="font-semibold text-white">Coba Lagi</Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center pt-20">
            <Text className="text-lg font-semibold text-gray-900">
              Tidak ada riwayat ditemukan
            </Text>
            <Text className="mt-1 text-sm text-gray-500">
              Coba gunakan filter atau pencarian lain
            </Text>
          </View>
        ) : (
          filtered.map((order) => {
            const total = getTotal(order);
            const status = (order.service_status ?? "WAITING").toUpperCase();
            const isPaid = (order.payment_status ?? "").toUpperCase() === "PAID";

            return (
              <Pressable
                key={order.id}
                onPress={() => router.push(`/order/${order.id}`)}
                className="mb-3 rounded-2xl border border-gray-200 bg-white p-4"
              >
                <View className="mb-3 flex-row items-start justify-between">
                  <View>
                    <Text className="text-base font-bold text-gray-900">
                      #{order.id}
                    </Text>
                    <Text className="mt-1 text-xs text-gray-400">
                      {formatDate(order.order_date)}
                    </Text>
                  </View>

                  <View className="items-end gap-1.5">
                    <OrderStatusBadge status={status} />
                    <View
                      className={`rounded-full px-2.5 py-0.5 ${
                        isPaid
                          ? "bg-emerald-50 border border-emerald-200"
                          : "bg-amber-50 border border-amber-200"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          isPaid ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {isPaid ? "LUNAS" : "UNPAID"}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text className="text-sm font-semibold text-gray-900">
                  {order.customers?.name ?? "-"}
                </Text>

                <Text className="mt-0.5 text-[13px] text-gray-500">
                  {order.vehicles?.plate_number ?? "-"} ·{" "}
                  {order.vehicles
                    ? `${order.vehicles.brand} ${order.vehicles.model}`
                    : "-"}
                </Text>

                <View className="mt-3 flex-row items-center justify-between border-t border-gray-100 pt-3">
                  <Text
                    className="flex-1 pr-2 text-[13px] text-gray-500"
                    numberOfLines={1}
                  >
                    {order.order_items
                      ?.map((i) => i.services?.name)
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </Text>

                  <Text className="text-[15px] font-bold text-gray-900">
                    Rp {total.toLocaleString("id-ID")}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}

        {totalPages > 1 && !isSearching && (
          <View className="mt-4 flex-row items-center justify-between">
            <Pressable
              disabled={page <= 1}
              onPress={() => fetchOrders(page - 1, false, 15)}
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
              onPress={() => fetchOrders(page + 1, false, 15)}
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
    </View>
  );
}
