import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  Car,
  CreditCard,
  User,
  UserRound,
  WalletCards,
} from "lucide-react-native";

import { useOrder } from "@/hooks/useOrder";
import { getPaymentByOrder } from "@/services/payment.service";

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { order, loading, error, refetch } = useOrder(id);

  const [paymentMethod, setPaymentMethod] = useState<string>("-");
  const [loadingPayment, setLoadingPayment] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  useEffect(() => {
    let cancelled = false;

    const loadPayment = async () => {
      if (!order || order.payment_status !== "Paid" || !id) {
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

    loadPayment();

    return () => {
      cancelled = true;
    };
  }, [order, id]);

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
          {error || "Order not found"}
        </Text>

        <Pressable
          className="mt-4 rounded-xl bg-gray-900 px-5 py-3"
          onPress={() => router.back()}
        >
          <Text className="text-sm font-semibold text-white">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const currentStatus = order.service_status ?? "Waiting";

  const statusStyles = {
    Waiting: {
      container: "bg-gray-100",
      dot: "bg-gray-500",
      text: "text-gray-700",
    },
    Washing: {
      container: "bg-blue-100",
      dot: "bg-blue-600",
      text: "text-blue-700",
    },
    Completed: {
      container: "bg-green-100",
      dot: "bg-green-600",
      text: "text-green-700",
    },
  } as const;

  const statusStyle =
    statusStyles[currentStatus as keyof typeof statusStyles] ??
    statusStyles.Waiting;

  const total =
    order.order_items?.reduce((sum, item) => sum + Number(item.subtotal), 0) ??
    0;

  return (
    <View className="flex-1 bg-gray-50">
      <View className="h-[110px] flex-row items-center justify-between border-b border-gray-200 bg-white px-5 pt-[50px]">
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full"
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color="#111827" />
        </Pressable>

        <Text className="text-lg font-bold text-gray-900">Order Detail</Text>

        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-5 pb-10"
      >
        <View className="mb-7 flex-row items-center justify-between">
          <View>
            <Text className="text-[13px] text-gray-500">Order ID</Text>

            <Text className="mt-1 text-2xl font-bold text-gray-900">
              #{order.id}
            </Text>

            <Text className="mt-1 text-xs text-gray-400">
              {order.order_date
                ? new Date(order.order_date).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "-"}
            </Text>
          </View>

          <View
            className={`flex-row items-center rounded-full px-3 py-[7px] ${statusStyle.container}`}
          >
            <View
              className={`mr-[6px] h-[7px] w-[7px] rounded-full ${statusStyle.dot}`}
            />
            <Text className={`text-xs font-semibold ${statusStyle.text}`}>
              {currentStatus}
            </Text>
          </View>
        </View>

        <View className="mb-5">
          <Text className="mb-[10px] text-[15px] font-bold text-gray-900">
            Customer
          </Text>

          <View className="flex-row items-center gap-[14px] rounded-[14px] border border-gray-200 bg-white p-4">
            <User size={20} color="#6B7280" />

            <View className="flex-1">
              <Text className="text-xs text-gray-400">Name</Text>
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

        <View className="mb-5">
          <Text className="mb-[10px] text-[15px] font-bold text-gray-900">
            Vehicle
          </Text>

          <View className="flex-row items-center gap-[14px] rounded-[14px] border border-gray-200 bg-white p-4">
            <Car size={20} color="#6B7280" />

            <View className="flex-1">
              <Text className="text-xs text-gray-400">Vehicle</Text>
              <Text className="mt-[2px] text-[15px] font-semibold text-gray-900">
                {order.vehicles
                  ? `${order.vehicles.brand} ${order.vehicles.model}`
                  : "-"}
              </Text>
              <Text className="mt-1 text-[13px] text-gray-500">
                {order.vehicles?.plate_number ?? "-"}
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-5">
          <Text className="mb-[10px] text-[15px] font-bold text-gray-900">
            Staff
          </Text>

          <View className="flex-row items-center gap-[14px] rounded-[14px] border border-gray-200 bg-white p-4">
            <UserRound size={20} color="#6B7280" />

            <View className="flex-1">
              <Text className="text-xs text-gray-400">Assigned Staff</Text>
              <Text className="mt-[2px] text-[15px] font-semibold text-gray-900">
                {order.staffs?.name ?? "-"}
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-5">
          <Text className="mb-[10px] text-[15px] font-bold text-gray-900">
            Check In Time
          </Text>

          <View className="rounded-[14px] border border-gray-200 bg-white p-4">
            <Text className="text-[15px] font-semibold text-gray-900">
              {order.check_in_time ?? "-"}
            </Text>
          </View>
        </View>

        <View className="mb-5">
          <Text className="mb-[10px] text-[15px] font-bold text-gray-900">
            Service
          </Text>

          {order.order_items && order.order_items.length > 0 ? (
            order.order_items.map((item) => (
              <View
                key={item.id}
                className="mb-2 flex-row items-center justify-between rounded-[14px] border border-gray-200 bg-white p-4"
              >
                <View className="flex-1 pr-3">
                  <Text className="text-[15px] font-semibold text-gray-900">
                    {item.services?.name ?? "Unknown Service"}
                  </Text>
                  <Text className="mt-1 text-xs text-gray-400">
                    Qty: {item.qty}
                  </Text>
                </View>

                <Text className="text-base font-bold text-gray-900">
                  Rp {Number(item.subtotal).toLocaleString("id-ID")}
                </Text>
              </View>
            ))
          ) : (
            <View className="rounded-[14px] border border-gray-200 bg-white p-4">
              <Text className="text-sm text-gray-500">No services</Text>
            </View>
          )}
        </View>

        <View className="mb-5 flex-row items-center justify-between rounded-[14px] border border-gray-200 bg-white p-4">
          <Text className="text-[15px] font-semibold text-gray-700">Total</Text>
          <Text className="text-lg font-bold text-gray-900">
            Rp {total.toLocaleString("id-ID")}
          </Text>
        </View>

        <View className="mb-5">
          <Text className="mb-[10px] text-[15px] font-bold text-gray-900">
            Payment
          </Text>

          <View className="flex-row items-center gap-[14px] rounded-[14px] border border-gray-200 bg-white p-4">
            <CreditCard size={20} color="#6B7280" />

            <View className="flex-1">
              <Text className="text-xs text-gray-400">Payment Status</Text>
              <Text
                className={`mt-[2px] text-sm font-semibold ${
                  order.payment_status === "Paid"
                    ? "text-green-600"
                    : "text-gray-900"
                }`}
              >
                {order.payment_status ?? "Unpaid"}
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-5">
          <Text className="mb-[10px] text-[15px] font-bold text-gray-900">
            Payment Method
          </Text>

          <View className="flex-row items-center gap-[14px] rounded-[14px] border border-gray-200 bg-white p-4">
            <WalletCards size={20} color="#6B7280" />

            <View className="flex-1">
              <Text className="text-xs text-gray-400">Payment Method</Text>
              <Text className="mt-[2px] text-[15px] font-semibold text-gray-900">
                {order.payment_status === "Paid"
                  ? loadingPayment
                    ? "Loading..."
                    : paymentMethod
                  : "-"}
              </Text>
            </View>
          </View>
        </View>

        {order.payment_status !== "Paid" && (
          <Pressable
            className="mt-2 h-[52px] items-center justify-center rounded-[14px] bg-gray-900"
            onPress={() => router.push(`/order/update?id=${order.id}`)}
          >
            <Text className="text-[15px] font-bold text-white">Edit Order</Text>
          </Pressable>
        )}

        {order.service_status === "Completed" &&
          order.payment_status !== "Paid" && (
            <Pressable
              className="mt-3 h-[52px] items-center justify-center rounded-[14px] border border-gray-900 bg-white"
              onPress={() =>
                router.push({
                  pathname: "/order/payment",
                  params: { id: String(order.id) },
                })
              }
            >
              <Text className="text-[15px] font-bold text-gray-900">
                Make Payment
              </Text>
            </Pressable>
          )}

        {order.payment_status === "Paid" &&
          order.invoices &&
          order.invoices.length > 0 && (
            <Pressable
              className="mt-3 h-[52px] items-center justify-center rounded-[14px] border border-gray-900 bg-white"
              onPress={() => {
                const invoice = order.invoices?.[order.invoices.length - 1];
                if (!invoice) return;

                router.push({
                  pathname: "/invoice/[id]",
                  params: { id: String(invoice.id) },
                });
              }}
            >
              <Text className="text-[15px] font-bold text-gray-900">
                View Invoice
              </Text>
            </Pressable>
          )}
      </ScrollView>
    </View>
  );
}
