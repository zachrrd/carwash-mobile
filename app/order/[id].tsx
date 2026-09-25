import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Car,
  Check,
  CheckCircle2,
  CreditCard,
  FileText,
  Play,
  RefreshCw,
  User,
  UserCheck,
  UserPlus,
  UserRound,
  WalletCards,
  X,
} from "lucide-react-native";

import { useOrder } from "@/hooks/useOrder";
import {
  cancelOrder,
  completeOrder,
  updateOrder,
  updateOrderStatus,
} from "@/services/order.service";
import { getPaymentByOrder } from "@/services/payment.service";
import { getStaffs } from "@/services/staff.service";
import { connectSocket, socket } from "@/services/socket";
import type { OrderStatus, Staff } from "@/types/order";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { showError, showSuccess } from "@/utils/toast";

const formatRupiah = (value: number | string) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return "Rp 0";
  return `Rp ${amount.toLocaleString("id-ID")}`;
};

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const parsedOrderId = id ? Number(id) : NaN;

  const { order, loading, error, refetch } = useOrder(id);

  const [paymentMethod, setPaymentMethod] = useState<string>("-");
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Staff Assignment State
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loadingStaffs, setLoadingStaffs] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);

  // Focus effect to refetch
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // Real-time Socket.IO connection
  useEffect(() => {
    if (Number.isNaN(parsedOrderId) || parsedOrderId <= 0) return;

    void connectSocket();

    const handleConnect = () => {
      socket.emit("join-order", parsedOrderId);
    };

    const handleStatusUpdate = (data: {
      orderId: number;
      serviceStatus: OrderStatus;
    }) => {
      if (Number(data.orderId) === parsedOrderId) {
        refetch();
      }
    };

    socket.on("connect", handleConnect);
    socket.on("order-status-updated", handleStatusUpdate);

    if (socket.connected) {
      socket.emit("join-order", parsedOrderId);
    }

    return () => {
      socket.emit("leave-order", parsedOrderId);
      socket.off("connect", handleConnect);
      socket.off("order-status-updated", handleStatusUpdate);
    };
  }, [parsedOrderId, refetch]);

  // Load payment info if paid
  useEffect(() => {
    let cancelled = false;

    const loadPayment = async () => {
      const isPaid = (order?.payment_status ?? "").toUpperCase() === "PAID";
      if (!order || !isPaid || !id) {
        if (!cancelled) setPaymentMethod("-");
        return;
      }

      try {
        setLoadingPayment(true);
        const response = await getPaymentByOrder(Number(id));
        const data = response.data?.data ?? response.data;
        const payment = Array.isArray(data) ? data[0] : data;
        const method =
          payment?.payment_method ?? payment?.data?.payment_method ?? "-";

        if (!cancelled) setPaymentMethod(method || "-");
      } catch (err) {
        console.log("GET PAYMENT BY ORDER ERROR:", err);
        if (!cancelled) setPaymentMethod("-");
      } finally {
        if (!cancelled) setLoadingPayment(false);
      }
    };

    void loadPayment();

    return () => {
      cancelled = true;
    };
  }, [order, id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Open Staff Modal
  const handleOpenStaffModal = async () => {
    setSelectedStaffId(order?.staff_id ?? null);
    setStaffModalOpen(true);
    try {
      setLoadingStaffs(true);
      const res = await getStaffs(1, 100);
      const list = res.data?.data?.staffs ?? res.data?.data ?? [];
      // filter active
      const active = (list as Staff[]).filter(
        (s) =>
          !s.status ||
          s.status.toUpperCase() === "ACTIVE" ||
          s.status === "Active",
      );
      setStaffs(active);
    } catch (err) {
      console.log("LOAD STAFFS ERROR:", err);
      showError("Gagal memuat daftar staff");
    } finally {
      setLoadingStaffs(false);
    }
  };

  // Submit Staff Assignment
  const handleSaveStaff = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      await updateOrder(order.id, {
        staff_id: selectedStaffId,
      });
      showSuccess("Staff berhasil ditugaskan");
      setStaffModalOpen(false);
      await refetch();
    } catch (err: any) {
      showError(err?.response?.data?.message || "Gagal menugaskan staff");
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Order (WAITING -> CONFIRMED)
  const handleConfirmOrder = async () => {
    if (!order) return;
    if (!order.staff_id) {
      Alert.alert(
        "Staff Belum Ditugaskan",
        "Silakan tugaskan staff pencuci terlebih dahulu sebelum mengonfirmasi order.",
        [
          { text: "Batal", style: "cancel" },
          { text: "Pilih Staff", onPress: handleOpenStaffModal },
        ],
      );
      return;
    }

    setActionLoading(true);
    try {
      await updateOrderStatus(order.id, "CONFIRMED");
      showSuccess("Order berhasil dikonfirmasi");
      await refetch();
    } catch (err: any) {
      showError(err?.response?.data?.message || "Gagal mengonfirmasi order");
    } finally {
      setActionLoading(false);
    }
  };

  // Start Service (CONFIRMED -> IN_PROGRESS)
  const handleStartService = async () => {
    if (!order) return;
    if (!order.staff_id) {
      Alert.alert(
        "Staff Belum Ditugaskan",
        "Silakan tugaskan staff terlebih dahulu sebelum memulai layanan.",
        [
          { text: "Batal", style: "cancel" },
          { text: "Pilih Staff", onPress: handleOpenStaffModal },
        ],
      );
      return;
    }

    const isPaid = (order.payment_status ?? "").toUpperCase() === "PAID";
    if (!isPaid) {
      Alert.alert(
        "Pembayaran Belum Lunas",
        "Order harus dibayar sebelum proses pencucian dapat dimulai.",
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Bayar Sekarang",
            onPress: () =>
              router.push({
                pathname: "/order/payment",
                params: { id: String(order.id) },
              }),
          },
        ],
      );
      return;
    }

    setActionLoading(true);
    try {
      await updateOrderStatus(order.id, "IN_PROGRESS");
      showSuccess("Pencucian dimulai");
      await refetch();
    } catch (err: any) {
      showError(err?.response?.data?.message || "Gagal memulai pencucian");
    } finally {
      setActionLoading(false);
    }
  };

  // Complete Service (IN_PROGRESS -> COMPLETED)
  const handleCompleteService = () => {
    if (!order) return;

    Alert.alert(
      "Selesaikan Cuci?",
      `Pastikan pencucian untuk order #${order.id} telah selesai dikerjakan.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Selesai",
          onPress: async () => {
            setActionLoading(true);
            try {
              await completeOrder(order.id);
              showSuccess("Order berhasil diselesaikan");
              await refetch();
            } catch (err: any) {
              showError(
                err?.response?.data?.message || "Gagal menyelesaikan order",
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  // Cancel Order
  const handleCancelOrder = () => {
    if (!order) return;

    Alert.alert(
      "Batalkan Order?",
      `Apakah Anda yakin ingin membatalkan order #${order.id}? Tindakan ini tidak dapat diurungkan.`,
      [
        { text: "Kembali", style: "cancel" },
        {
          text: "Batalkan Order",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await cancelOrder(order.id);
              showSuccess("Order berhasil dibatalkan");
              await refetch();
            } catch (err: any) {
              showError(
                err?.response?.data?.message || "Gagal membatalkan order",
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#111827" />
        <Text className="mt-4 text-sm text-gray-500">Loading order...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-5">
        <Text className="text-lg font-semibold text-gray-900">
          {error || "Order tidak ditemukan"}
        </Text>
        <Pressable
          className="mt-4 rounded-xl bg-gray-900 px-5 py-3"
          onPress={() => router.back()}
        >
          <Text className="text-sm font-semibold text-white">Kembali</Text>
        </Pressable>
      </View>
    );
  }

  const currentStatus = (order.service_status ?? "WAITING").toUpperCase();
  const paymentStatus = (order.payment_status ?? "UNPAID").toUpperCase();
  const isPaid = paymentStatus === "PAID";
  const total =
    order.order_items?.reduce((sum, item) => sum + Number(item.subtotal), 0) ??
    0;

  const canEdit =
    !isPaid && currentStatus !== "COMPLETED" && currentStatus !== "CANCELLED";
  const canCancel =
    !isPaid && (currentStatus === "WAITING" || currentStatus === "CONFIRMED");

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="h-[110px] flex-row items-center justify-between border-b border-gray-200 bg-white px-5 pt-[50px]">
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full"
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color="#111827" />
        </Pressable>

        <View className="items-center">
          <Text className="text-lg font-bold text-gray-900">Detail Order</Text>
          <View className="flex-row items-center gap-1">
            <View className="h-2 w-2 rounded-full bg-emerald-500" />
            <Text className="text-[11px] text-gray-500">Live Sync</Text>
          </View>
        </View>

        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full"
          onPress={onRefresh}
          disabled={refreshing || actionLoading}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#111827" />
          ) : (
            <RefreshCw size={20} color="#111827" />
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-5 pb-20"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#111827"
          />
        }
      >
        {/* Order ID & Status Header */}
        <View className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="text-xs text-gray-400">Order ID</Text>
              <Text className="mt-1 text-2xl font-bold text-gray-900">
                #{order.id}
              </Text>
              <Text className="mt-1 text-xs text-gray-400">
                {order.order_date
                  ? new Date(order.order_date).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </Text>
            </View>

            <View className="items-end gap-2">
              <OrderStatusBadge status={currentStatus} />
              <View
                className={`rounded-full px-2.5 py-1 ${
                  isPaid
                    ? "border border-emerald-200 bg-emerald-50"
                    : "border border-amber-200 bg-amber-50"
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    isPaid ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {isPaid ? "LUNAS" : "BELUM LUNAS"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Operational Action Banner based on status */}
        <View className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
          <Text className="mb-3 text-sm font-bold text-gray-900">
            Aksi Operasional
          </Text>

          {/* WAITING status actions */}
          {currentStatus === "WAITING" && (
            <View className="gap-3">
              <Text className="text-xs text-gray-500">
                Pesanan baru masuk. Tugaskan staff dan konfirmasi pesanan.
              </Text>

              <Pressable
                className={`h-12 flex-row items-center justify-center rounded-xl ${
                  order.staff_id ? "bg-blue-600" : "bg-gray-900"
                }`}
                onPress={handleConfirmOrder}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <CheckCircle2 size={18} color="#fff" />
                    <Text className="ml-2 font-bold text-white">
                      Konfirmasi Order
                    </Text>
                  </>
                )}
              </Pressable>

              {!isPaid && (
                <Pressable
                  className="h-12 flex-row items-center justify-center rounded-xl bg-emerald-600"
                  onPress={() =>
                    router.push({
                      pathname: "/order/payment",
                      params: { id: String(order.id) },
                    })
                  }
                  disabled={actionLoading}
                >
                  <CreditCard size={18} color="#fff" />
                  <Text className="ml-2 font-bold text-white">
                    Proses Pembayaran ({formatRupiah(total)})
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* CONFIRMED status actions */}
          {currentStatus === "CONFIRMED" && (
            <View className="gap-3">
              <Text className="text-xs text-gray-500">
                Pesanan telah dikonfirmasi. Pastikan sudah dibayar sebelum
                memulai cuci.
              </Text>

              {!isPaid ? (
                <Pressable
                  className="h-12 flex-row items-center justify-center rounded-xl bg-emerald-600"
                  onPress={() =>
                    router.push({
                      pathname: "/order/payment",
                      params: { id: String(order.id) },
                    })
                  }
                  disabled={actionLoading}
                >
                  <CreditCard size={18} color="#fff" />
                  <Text className="ml-2 font-bold text-white">
                    Proses Pembayaran Sekarang
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  className="h-12 flex-row items-center justify-center rounded-xl bg-orange-600"
                  onPress={handleStartService}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Play size={18} color="#fff" />
                      <Text className="ml-2 font-bold text-white">
                        Mulai Cuci (In Progress)
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          )}

          {/* IN_PROGRESS status actions */}
          {currentStatus === "IN_PROGRESS" && (
            <View className="gap-3">
              <Text className="text-xs text-gray-500">
                Kendaraan sedang dalam proses pencucian oleh{" "}
                {order.staffs?.name ?? "staff"}.
              </Text>

              <Pressable
                className="h-12 flex-row items-center justify-center rounded-xl bg-emerald-600"
                onPress={handleCompleteService}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <CheckCircle2 size={18} color="#fff" />
                    <Text className="ml-2 font-bold text-white">
                      Selesaikan Pencucian (Completed)
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {/* COMPLETED status */}
          {currentStatus === "COMPLETED" && (
            <View className="gap-3">
              <View className="flex-row items-center rounded-xl bg-emerald-50 p-3">
                <CheckCircle2 size={20} color="#059669" />
                <Text className="ml-2 text-sm font-semibold text-emerald-800">
                  Layanan telah selesai dikerjakan!
                </Text>
              </View>

              {order.invoices && order.invoices.length > 0 && (
                <Pressable
                  className="h-12 flex-row items-center justify-center rounded-xl bg-gray-900"
                  onPress={() => {
                    const invoice = order.invoices?.[order.invoices.length - 1];
                    if (invoice) {
                      router.push({
                        pathname: "/invoice/[id]",
                        params: { id: String(invoice.id) },
                      });
                    }
                  }}
                >
                  <FileText size={18} color="#fff" />
                  <Text className="ml-2 font-bold text-white">
                    Lihat Invoice
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* CANCELLED status */}
          {currentStatus === "CANCELLED" && (
            <View className="flex-row items-center rounded-xl bg-rose-50 p-3">
              <Ban size={20} color="#e11d48" />
              <Text className="ml-2 text-sm font-semibold text-rose-800">
                Pesanan ini telah dibatalkan.
              </Text>
            </View>
          )}
        </View>

        {/* Staff Section with Assign/Change button */}
        <View className="mb-5">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[15px] font-bold text-gray-900">
              Staff Bertugas
            </Text>
            {currentStatus !== "COMPLETED" && currentStatus !== "CANCELLED" && (
              <Pressable
                className="flex-row items-center rounded-lg bg-gray-100 px-3 py-1.5"
                onPress={handleOpenStaffModal}
              >
                <UserCheck size={14} color="#111827" />
                <Text className="ml-1 text-xs font-semibold text-gray-900">
                  {order.staff_id ? "Ganti Staff" : "Tugaskan Staff"}
                </Text>
              </Pressable>
            )}
          </View>

          <View className="flex-row items-center gap-[14px] rounded-[14px] border border-gray-200 bg-white p-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <UserRound size={20} color="#2563eb" />
            </View>

            <View className="flex-1">
              <Text className="text-xs text-gray-400">Nama Staff</Text>
              <Text className="mt-[2px] text-[15px] font-semibold text-gray-900">
                {order.staffs?.name ?? "Belum ditugaskan"}
              </Text>
              {order.staffs?.phone && (
                <Text className="mt-0.5 text-xs text-gray-500">
                  {order.staffs.phone}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Customer Details */}
        <View className="mb-5">
          <Text className="mb-[10px] text-[15px] font-bold text-gray-900">
            Customer
          </Text>

          <View className="flex-row items-center gap-[14px] rounded-[14px] border border-gray-200 bg-white p-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <User size={20} color="#6B7280" />
            </View>

            <View className="flex-1">
              <Text className="text-xs text-gray-400">Nama Lengkap</Text>
              <Text className="mt-[2px] text-[15px] font-semibold text-gray-900">
                {order.customers?.name ?? "-"}
              </Text>

              {order.customers?.phone && (
                <Text className="mt-1 text-[13px] text-gray-500">
                  {order.customers.phone}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Vehicle Details */}
        <View className="mb-5">
          <Text className="mb-[10px] text-[15px] font-bold text-gray-900">
            Kendaraan
          </Text>

          <View className="flex-row items-center gap-[14px] rounded-[14px] border border-gray-200 bg-white p-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <Car size={20} color="#6B7280" />
            </View>

            <View className="flex-1">
              <Text className="text-xs text-gray-400">Model Kendaraan</Text>
              <Text className="mt-[2px] text-[15px] font-semibold text-gray-900">
                {order.vehicles
                  ? `${order.vehicles.brand} ${order.vehicles.model}`
                  : "-"}
              </Text>
              <Text className="mt-1 text-[13px] font-medium text-gray-500">
                Plat: {order.vehicles?.plate_number ?? "-"}
              </Text>
            </View>
          </View>
        </View>

        {/* Check-In Time */}
        <View className="mb-5">
          <Text className="mb-[10px] text-[15px] font-bold text-gray-900">
            Jam Check In
          </Text>

          <View className="rounded-[14px] border border-gray-200 bg-white p-4">
            <Text className="text-[15px] font-semibold text-gray-900">
              {order.check_in_time ? `${order.check_in_time} WIB` : "-"}
            </Text>
          </View>
        </View>

        {/* Services Ordered */}
        <View className="mb-5">
          <Text className="mb-[10px] text-[15px] font-bold text-gray-900">
            Layanan
          </Text>

          {order.order_items && order.order_items.length > 0 ? (
            order.order_items.map((item) => (
              <View
                key={item.id}
                className="mb-2 flex-row items-center justify-between rounded-[14px] border border-gray-200 bg-white p-4"
              >
                <View className="flex-1 pr-3">
                  <Text className="text-[15px] font-semibold text-gray-900">
                    {item.services?.name ?? "Layanan"}
                  </Text>
                  <Text className="mt-1 text-xs text-gray-400">
                    Qty: {item.qty} ×{" "}
                    {formatRupiah(Number(item.services?.price ?? 0))}
                  </Text>
                </View>

                <Text className="text-base font-bold text-gray-900">
                  {formatRupiah(item.subtotal)}
                </Text>
              </View>
            ))
          ) : (
            <View className="rounded-[14px] border border-gray-200 bg-white p-4">
              <Text className="text-sm text-gray-500">Tidak ada layanan</Text>
            </View>
          )}
        </View>

        {/* Total Box */}
        <View className="mb-5 flex-row items-center justify-between rounded-[14px] border border-gray-200 bg-white p-4">
          <Text className="text-[15px] font-semibold text-gray-700">
            Total Pembayaran
          </Text>
          <Text className="text-xl font-bold text-gray-900">
            {formatRupiah(total)}
          </Text>
        </View>

        {/* Payment Summary */}
        <View className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
          <Text className="mb-3 text-sm font-bold text-gray-900">
            Informasi Pembayaran
          </Text>

          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-xs text-gray-500">Status Pembayaran</Text>
            <View
              className={`rounded-full px-2.5 py-1 ${
                isPaid ? "bg-emerald-100" : "bg-amber-100"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isPaid ? "text-emerald-800" : "text-amber-800"
                }`}
              >
                {isPaid ? "Lunas" : "Belum Bayar"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-gray-500">Metode Pembayaran</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {isPaid
                ? loadingPayment
                  ? "Loading..."
                  : paymentMethod
                : "-"}
            </Text>
          </View>
        </View>

        {/* Action Buttons: Edit & Cancel */}
        <View className="gap-3">
          {canEdit && (
            <Pressable
              className="h-[50px] items-center justify-center rounded-[14px] bg-gray-900"
              onPress={() => router.push(`/order/update?id=${order.id}`)}
            >
              <Text className="text-[15px] font-bold text-white">
                Edit Data Order
              </Text>
            </Pressable>
          )}

          {canCancel && (
            <Pressable
              className="h-[50px] items-center justify-center rounded-[14px] border border-red-500 bg-white"
              onPress={handleCancelOrder}
              disabled={actionLoading}
            >
              <Text className="text-[15px] font-bold text-red-600">
                Batalkan Order
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Staff Selection Modal */}
      <Modal
        visible={staffModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setStaffModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[80%] rounded-t-3xl bg-white p-5 pb-8">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-900">
                Pilih Staff Bertugas
              </Text>
              <Pressable
                className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
                onPress={() => setStaffModalOpen(false)}
              >
                <X size={18} color="#6B7280" />
              </Pressable>
            </View>

            {loadingStaffs ? (
              <View className="py-10 items-center justify-center">
                <ActivityIndicator size="small" color="#111827" />
                <Text className="mt-2 text-xs text-gray-500">
                  Memuat daftar staff...
                </Text>
              </View>
            ) : staffs.length === 0 ? (
              <Text className="py-8 text-center text-sm text-gray-500">
                Tidak ada staff aktif yang tersedia
              </Text>
            ) : (
              <ScrollView className="max-h-72">
                {staffs.map((staff) => {
                  const isSelected = selectedStaffId === staff.id;
                  return (
                    <Pressable
                      key={staff.id}
                      className={`mb-2 flex-row items-center justify-between rounded-xl border p-3.5 ${
                        isSelected
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 bg-white"
                      }`}
                      onPress={() => setSelectedStaffId(staff.id)}
                    >
                      <View className="flex-1">
                        <Text
                          className={`text-sm font-semibold ${
                            isSelected ? "text-gray-900" : "text-gray-700"
                          }`}
                        >
                          {staff.name}
                        </Text>
                        {staff.phone && (
                          <Text className="mt-0.5 text-xs text-gray-400">
                            {staff.phone}
                          </Text>
                        )}
                      </View>

                      {isSelected && (
                        <View className="h-6 w-6 items-center justify-center rounded-full bg-gray-900">
                          <Check size={14} color="#fff" strokeWidth={3} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <View className="mt-5 flex-row gap-3">
              <Pressable
                className="h-12 flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white"
                onPress={() => setStaffModalOpen(false)}
              >
                <Text className="font-semibold text-gray-700">Batal</Text>
              </Pressable>

              <Pressable
                className="h-12 flex-1 items-center justify-center rounded-xl bg-gray-900"
                onPress={handleSaveStaff}
                disabled={actionLoading || selectedStaffId === null}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-bold text-white">Simpan</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
