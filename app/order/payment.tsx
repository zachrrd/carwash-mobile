import { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ArrowLeft,
  Banknote,
  Check,
  CreditCard,
  QrCode,
} from "lucide-react-native";

import { useOrder } from "@/hooks/useOrder";
import { useCreatePayment } from "@/hooks/useCreatePayment";
import type { PaymentMethod } from "@/types/order";
import { showSuccess, showError } from "@/utils/toast";

const paymentMethods: {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: typeof Banknote;
}[] = [
  {
    id: "Cash",
    label: "Cash",
    description: "Pay directly with cash",
    icon: Banknote,
  },
  {
    id: "QRIS",
    label: "QRIS",
    description: "Pay using QRIS",
    icon: QrCode,
  },
  {
    id: "Transfer",
    label: "Transfer",
    description: "Bank transfer",
    icon: CreditCard,
  },
];

const formatRupiah = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

export default function PaymentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const { order, loading: orderLoading, error: orderError } = useOrder(id);
  const { pay, loading: paying, error: payError } = useCreatePayment();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("Cash");
  const [amountReceived, setAmountReceived] = useState("");

  const total = useMemo(() => {
    if (!order?.order_items) return 0;
    return order.order_items.reduce(
      (sum, item) => sum + Number(item.subtotal ?? 0),
      0,
    );
  }, [order]);

  const received = Number(amountReceived) || 0;
  const change = received >= total ? received - total : 0;
  const canSubmit = selectedMethod && received >= total && total > 0 && !paying;

  const handleConfirmPayment = async () => {
    if (!order || !id || !canSubmit) return;

    try {
      const result = await pay({
        order_id: Number(id),
        amount_received: received,
        payment_method: selectedMethod,
      });

      const invoiceId = result?.invoice?.id ?? result?.invoice_id;

      showSuccess("Payment Berhasil");

      setTimeout(() => {
        if (invoiceId) {
          router.replace({
            pathname: "/invoice/[id]",
            params: { id: String(invoiceId) },
          });
        } else {
          router.back();
        }
      }, 800);
    } catch (err: any) {
      console.error(err);
      showError(
        err?.response?.data?.message || "Gagal membuat order. Coba lagi.",
      );
    }
  };

  // =========================
  // LOADING
  // =========================
  if (orderLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#111827" />
        <Text className="mt-4 text-sm text-gray-500">Loading order...</Text>
      </View>
    );
  }

  if (orderError || !order) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-5">
        <Text className="text-lg font-semibold text-gray-900">
          {orderError || "Order not found"}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 rounded-xl bg-gray-900 px-5 py-3"
        >
          <Text className="font-semibold text-white">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (order.payment_status === "Paid") {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-5">
        <Text className="text-lg font-semibold text-gray-900">
          Order sudah dibayar
        </Text>
        <Text className="mt-2 text-center text-sm text-gray-500">
          Pembayaran untuk order ini sudah selesai.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 rounded-xl bg-gray-900 px-5 py-3"
        >
          <Text className="font-semibold text-white">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* HEADER */}
      <View className="h-[110px] flex-row items-center justify-between border-b border-gray-200 bg-white px-5 pt-[50px]">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full"
          disabled={paying}
        >
          <ArrowLeft size={22} color="#111827" />
        </Pressable>

        <Text className="text-lg font-bold text-gray-900">Payment</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-5 pb-[140px] pt-5"
      >
        {/* ORDER SUMMARY */}
        <View className="rounded-2xl border border-gray-200 bg-white p-[18px]">
          <Text className="text-[13px] text-gray-500">Order</Text>
          <Text className="mt-1 text-2xl font-bold text-gray-900">
            #{order.id}
          </Text>

          <View className="my-[16px] h-px bg-gray-200" />

          <View className="mb-3 flex-row justify-between">
            <Text className="text-sm text-gray-500">Customer</Text>
            <Text className="max-w-[55%] text-right text-sm font-medium text-gray-900">
              {order.customers?.name ?? "-"}
            </Text>
          </View>

          <View className="mb-3 flex-row justify-between">
            <Text className="text-sm text-gray-500">Vehicle</Text>
            <Text className="max-w-[55%] text-right text-sm font-medium text-gray-900">
              {order.vehicles
                ? `${order.vehicles.brand} ${order.vehicles.model}`
                : "-"}
            </Text>
          </View>

          <View className="my-[16px] h-px bg-gray-200" />

          {/* Services */}
          <Text className="mb-2 text-sm font-semibold text-gray-900">
            Services
          </Text>
          {order.order_items?.map((item) => (
            <View
              key={item.id}
              className="mb-2 flex-row items-center justify-between"
            >
              <Text className="flex-1 text-sm text-gray-700">
                {item.services?.name ?? `Service #${item.service_id}`}
                {item.qty && item.qty > 1 ? ` × ${item.qty}` : ""}
              </Text>
              <Text className="text-sm font-medium text-gray-900">
                {formatRupiah(Number(item.subtotal))}
              </Text>
            </View>
          ))}

          <View className="my-[16px] h-px bg-gray-200" />

          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] font-semibold text-gray-900">
              Total Payment
            </Text>
            <Text className="text-xl font-bold text-gray-900">
              {formatRupiah(total)}
            </Text>
          </View>
        </View>

        {/* PAYMENT METHOD */}
        <View className="mt-7">
          <Text className="mb-3 text-base font-bold text-gray-900">
            Select Payment Method
          </Text>

          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;

            return (
              <Pressable
                key={method.id}
                onPress={() => setSelectedMethod(method.id)}
                className={`mb-3 flex-row items-center rounded-[14px] border bg-white p-4 ${
                  isSelected ? "border-2 border-gray-900" : "border-gray-200"
                }`}
              >
                <View
                  className={`mr-[14px] h-[46px] w-[46px] items-center justify-center rounded-xl ${
                    isSelected ? "bg-gray-200" : "bg-gray-100"
                  }`}
                >
                  <Icon size={22} color="#111827" />
                </View>

                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-gray-900">
                    {method.label}
                  </Text>
                  <Text className="mt-1 text-[13px] text-gray-500">
                    {method.description}
                  </Text>
                </View>

                {isSelected && (
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-gray-900">
                    <Check size={16} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* AMOUNT RECEIVED */}
        <View className="mt-6">
          <Text className="mb-2 text-sm font-semibold text-gray-900">
            Amount Received
          </Text>
          <TextInput
            className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900"
            value={amountReceived}
            onChangeText={setAmountReceived}
            placeholder={`Minimal ${formatRupiah(total)}`}
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </View>

        {/* CHANGE */}
        {received >= total && total > 0 && (
          <View className="mt-4 rounded-xl bg-green-50 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-700">Change</Text>
              <Text className="text-lg font-bold text-green-600">
                {formatRupiah(change)}
              </Text>
            </View>
          </View>
        )}

        {payError ? (
          <Text className="mt-4 text-center text-sm text-red-500">
            {payError}
          </Text>
        ) : null}
      </ScrollView>

      {/* FOOTER */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-5 pb-7 pt-4">
        <Pressable
          disabled={!canSubmit}
          onPress={handleConfirmPayment}
          className={`h-[52px] items-center justify-center rounded-[14px] ${
            canSubmit ? "bg-gray-900" : "bg-gray-300"
          }`}
        >
          {paying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-[15px] font-bold text-white">
              Confirm Payment
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
