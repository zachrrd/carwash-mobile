import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Plus, RefreshCw, Search, X } from "lucide-react-native";
import OrderCard from "@/components/orders/OrderCard";
import { deleteOrder, getOrders } from "@/services/order.service";
import { connectSocket, socket } from "@/services/socket";
import type { Order, OrderStatus } from "@/types/order";

const filters = [
  { key: "ALL", label: "All" },
  { key: "WAITING", label: "Waiting" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
] as const;

type FilterKey = (typeof filters)[number]["key"];

const PAGE_SIZE = 20;
const SEARCH_LIMIT = 1000;

export default function OrdersScreen() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const isSearching = search.trim().length > 0;
  const isFetchingRef = useRef(false);

  const fetchOrders = useCallback(
    async ({
      isRefresh = false,
      isLoadMore = false,
      searchText = "",
      targetPage = 1,
    }: {
      isRefresh?: boolean;
      isLoadMore?: boolean;
      searchText?: string;
      targetPage?: number;
    } = {}) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError("");

        const limit = searchText.trim() ? SEARCH_LIMIT : PAGE_SIZE;
        const currentPage = searchText.trim() ? 1 : targetPage;

        const response = await getOrders(currentPage, limit, searchText.trim() || undefined);

        const payload = response.data?.data ?? response.data ?? {};
        const backendOrders: Order[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.data)
            ? payload.data
            : Array.isArray(payload.orders)
              ? payload.orders
              : [];

        const pagination = payload.pagination ?? payload.meta ?? null;

        if (!Array.isArray(backendOrders)) {
          throw new Error("Orders response is not an array");
        }

        if (searchText.trim() || isRefresh || currentPage === 1) {
          setOrders(backendOrders);
        } else {
          setOrders((prev) => {
            const existingIds = new Set(prev.map((o) => o.id));
            const newOnes = backendOrders.filter((o) => !existingIds.has(o.id));
            return [...prev, ...newOnes];
          });
        }

        // Update pagination info
        if (pagination) {
          const totalPages =
            pagination.totalPages ??
            pagination.total_pages ??
            Math.ceil((pagination.total ?? 0) / limit);

          setHasMore(currentPage < totalPages);
          setPage(currentPage);
        } else {
          setHasMore(backendOrders.length >= limit);
          setPage(currentPage);
        }
      } catch (err: any) {
        console.log("FETCH ORDERS ERROR:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Gagal memuat daftar order",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [],
  );

  // Real-time socket listener for orders updates
  useEffect(() => {
    void connectSocket();

    const handleStatusUpdate = (data: {
      orderId: number;
      serviceStatus: OrderStatus;
      order?: Order;
    }) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === data.orderId) {
            return {
              ...o,
              ...(data.order ? data.order : { service_status: data.serviceStatus }),
            };
          }
          return o;
        }),
      );
    };

    socket.on("order-status-updated", handleStatusUpdate);

    return () => {
      socket.off("order-status-updated", handleStatusUpdate);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isSearching) {
        setPage(1);
        setHasMore(true);
        fetchOrders({ isRefresh: false, targetPage: 1 });
      }
    }, [fetchOrders, isSearching]),
  );

  const handleSearchChange = (text: string) => {
    setSearch(text);

    if (text.trim().length > 0) {
      setPage(1);
      setHasMore(false);
      fetchOrders({ searchText: text, targetPage: 1 });
    } else {
      setPage(1);
      setHasMore(true);
      fetchOrders({ targetPage: 1 });
    }
  };

  const handleClearSearch = () => {
    setSearch("");
    setPage(1);
    setHasMore(true);
    fetchOrders({ targetPage: 1 });
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isSearching || !hasMore || loadingMore || loading || refreshing) return;

    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const paddingToBottom = 200;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    if (isCloseToBottom) {
      const nextPage = page + 1;
      fetchOrders({ isLoadMore: true, targetPage: nextPage });
    }
  };

  const handleDelete = (order: Order) => {
    const isPaid = (order.payment_status ?? "").toUpperCase() === "PAID";
    const status = (order.service_status ?? "").toUpperCase();

    if (isPaid) {
      Alert.alert(
        "Tidak bisa dihapus",
        "Order yang sudah dibayar tidak dapat dihapus.",
      );
      return;
    }

    if (status === "COMPLETED" || status === "CANCELLED") {
      Alert.alert(
        "Tidak bisa dihapus",
        `Order dengan status ${status} tidak dapat dihapus.`,
      );
      return;
    }

    Alert.alert(
      "Hapus Order?",
      `Order #${order.id} akan dihapus secara permanen. Lanjutkan?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteOrder(order.id);
              setOrders((prev) => prev.filter((o) => o.id !== order.id));
              Alert.alert("Berhasil", "Order berhasil dihapus.");
            } catch (err: any) {
              Alert.alert(
                "Gagal",
                err?.response?.data?.message || "Gagal menghapus order.",
              );
            }
          },
        },
      ],
    );
  };

  const filteredOrders = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return orders.filter((order) => {
      const currentStatus = (order.service_status ?? "WAITING").toUpperCase();
      const matchesFilter =
        activeFilter === "ALL" || currentStatus === activeFilter;

      if (!matchesFilter) return false;

      if (searchText.length === 0) return true;

      const customerName = order.customers?.name?.toLowerCase() ?? "";
      const vehicleName = order.vehicles
        ? `${order.vehicles.brand} ${order.vehicles.model}`.toLowerCase()
        : "";
      const plate = order.vehicles?.plate_number?.toLowerCase() ?? "";
      const serviceMatch =
        order.order_items?.some((item) =>
          item.services?.name?.toLowerCase().includes(searchText),
        ) ?? false;

      return (
        String(order.id).toLowerCase().includes(searchText) ||
        customerName.includes(searchText) ||
        vehicleName.includes(searchText) ||
        plate.includes(searchText) ||
        serviceMatch
      );
    });
  }, [orders, search, activeFilter]);

  return (
    <View className="flex-1 bg-gray-50 px-5 pt-[60px]">
      {/* Header */}
      <View className="mb-5 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[28px] font-bold text-gray-900">Orders</Text>
          <Text className="mt-1 text-sm text-gray-500">
            Kelola pesanan customer & layanan pencucian
          </Text>
        </View>

        <Pressable
          onPress={() => {
            setPage(1);
            setHasMore(true);
            fetchOrders({
              isRefresh: true,
              searchText: search,
              targetPage: 1,
            });
          }}
          className="h-11 w-11 items-center justify-center rounded-full bg-white border border-gray-200"
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#111827" />
          ) : (
            <RefreshCw size={20} color="#111827" />
          )}
        </Pressable>
      </View>

      {/* Search Bar */}
      <View className="h-[50px] flex-row items-center rounded-xl border border-gray-200 bg-white px-[14px]">
        <Search size={20} color="#6B7280" />
        <TextInput
          value={search}
          onChangeText={handleSearchChange}
          placeholder="Cari ID, nama customer, plat nomor..."
          placeholderTextColor="#9CA3AF"
          className="ml-[10px] flex-1 text-[15px] text-gray-900"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={handleClearSearch}>
            <X size={20} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      {/* Filter Horizontal Scroll */}
      <View className="py-[14px]">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="flex-row gap-2 pr-4"
        >
          {filters.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                onPress={() => setActiveFilter(filter.key)}
                className={`items-center justify-center rounded-full border px-4 py-[8px] ${
                  isActive
                    ? "border-gray-900 bg-gray-900"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`text-[13px] ${
                    isActive
                      ? "font-semibold text-white"
                      : "font-medium text-gray-600"
                  }`}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Order List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-[100px]"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setPage(1);
              setHasMore(true);
              fetchOrders({
                isRefresh: true,
                searchText: search,
                targetPage: 1,
              });
            }}
            tintColor="#111827"
            colors={["#111827"]}
          />
        }
      >
        {loading && !refreshing ? (
          <View className="items-center justify-center pt-20">
            <ActivityIndicator size="large" color="#111827" />
            <Text className="mt-4 text-sm text-gray-500">
              Memuat daftar order...
            </Text>
          </View>
        ) : error ? (
          <View className="items-center justify-center px-5 pt-20">
            <Text className="text-lg font-semibold text-red-600">
              Gagal memuat order
            </Text>
            <Text className="mt-2 text-center text-sm text-gray-500">
              {error}
            </Text>
            <Pressable
              onPress={() =>
                fetchOrders({
                  targetPage: 1,
                  searchText: search,
                })
              }
              className="mt-5 rounded-xl bg-gray-900 px-5 py-3"
            >
              <Text className="font-semibold text-white">Coba Lagi</Text>
            </Pressable>
          </View>
        ) : filteredOrders.length > 0 ? (
          <>
            {filteredOrders.map((order) => {
              const isPaid = (order.payment_status ?? "").toUpperCase() === "PAID";
              const status = (order.service_status ?? "").toUpperCase();
              const canDelete = !isPaid && status !== "COMPLETED" && status !== "CANCELLED";

              return (
                <OrderCard
                  key={order.id}
                  order={order}
                  onPress={() => router.push(`/order/${order.id}`)}
                  onDelete={canDelete ? () => handleDelete(order) : undefined}
                />
              );
            })}

            {/* Loading more indicator */}
            {loadingMore && (
              <View className="items-center py-6">
                <ActivityIndicator size="small" color="#111827" />
                <Text className="mt-2 text-xs text-gray-500">
                  Memuat lebih banyak...
                </Text>
              </View>
            )}

            {/* End of list */}
            {!hasMore && !isSearching && orders.length > 0 && (
              <Text className="py-6 text-center text-xs text-gray-400">
                Semua order sudah ditampilkan
              </Text>
            )}
          </>
        ) : (
          <View className="items-center justify-center pt-20">
            <Text className="text-lg font-semibold text-gray-900">
              Tidak ada order ditemukan
            </Text>
            <Text className="mt-[6px] text-sm text-gray-500">
              Coba gunakan filter atau kata kunci pencarian yang lain.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB Create */}
      <Pressable
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-gray-900"
        style={{
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 5,
        }}
        onPress={() => router.push("/order/create")}
      >
        <Plus size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
