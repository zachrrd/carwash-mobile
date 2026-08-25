import { useCallback, useMemo, useState, useRef } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Plus, Search, X, RefreshCw } from "lucide-react-native";
import OrderCard from "@/components/orders/OrderCard";
import { getOrders, deleteOrder } from "@/services/order.service";
import type { Order } from "@/types/order";

const filters = ["All", "Waiting", "Washing", "Completed"] as const;
type Filter = (typeof filters)[number];

const PAGE_SIZE = 20;
const SEARCH_LIMIT = 1000;

export default function OrdersScreen() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

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

        const response = await getOrders(currentPage, limit);

        // Sesuaikan dengan struktur response backend kamu
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
          // Fallback kalau backend tidak kirim pagination
          setHasMore(backendOrders.length >= limit);
          setPage(currentPage);
        }
      } catch (err: any) {
        console.log("FETCH ORDERS ERROR:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load orders",
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
    if (order.payment_status === "Paid") {
      Alert.alert(
        "Tidak bisa dihapus",
        "Order yang sudah dibayar tidak dapat dihapus.",
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
      const matchesFilter =
        activeFilter === "All" || order.service_status === activeFilter;

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
            Manage customer orders and car wash services
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
          className="h-11 w-11 items-center justify-center rounded-full bg-white"
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#111827" />
          ) : (
            <RefreshCw size={20} color="#111827" />
          )}
        </Pressable>
      </View>

      {/* Search */}
      <View className="h-[50px] flex-row items-center rounded-xl border border-gray-200 bg-white px-[14px]">
        <Search size={20} color="#6B7280" />
        <TextInput
          value={search}
          onChangeText={handleSearchChange}
          placeholder="Search order, customer..."
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

      {/* Filters */}
      <View className="flex-row gap-2 py-[16px]">
        {filters.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className={`min-w-0 flex-1 items-center justify-center rounded-full border px-2 py-[9px] ${
                isActive
                  ? "border-gray-900 bg-gray-900"
                  : "border-gray-200 bg-white"
              }`}
            >
              <Text
                numberOfLines={1}
                className={`text-[13px] ${
                  isActive
                    ? "font-semibold text-white"
                    : "font-medium text-gray-500"
                }`}
              >
                {filter}
              </Text>
            </Pressable>
          );
        })}
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
              Loading orders...
            </Text>
          </View>
        ) : error ? (
          <View className="items-center justify-center px-5 pt-20">
            <Text className="text-lg font-semibold text-red-600">
              Failed to load orders
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
              <Text className="font-semibold text-white">Try Again</Text>
            </Pressable>
          </View>
        ) : filteredOrders.length > 0 ? (
          <>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() => router.push(`/order/${order.id}`)}
                onDelete={
                  order.payment_status !== "Paid"
                    ? () => handleDelete(order)
                    : undefined
                }
              />
            ))}

            {/* Loading more indicator */}
            {loadingMore && (
              <View className="items-center py-6">
                <ActivityIndicator size="small" color="#111827" />
                <Text className="mt-2 text-xs text-gray-500">
                  Loading more...
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
              No orders found
            </Text>
            <Text className="mt-[6px] text-sm text-gray-500">
              Try another search or filter.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB Create */}
      <Pressable
        className="absolute bottom-5 right-5 h-14 w-14 items-center justify-center rounded-full bg-gray-900"
        style={{
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        }}
        onPress={() => router.push("/order/create")}
      >
        <Plus size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
