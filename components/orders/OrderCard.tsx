import { Pressable, Text, View } from "react-native";
import { Car, ChevronRight, Trash2, User } from "lucide-react-native";
import type { Order } from "@/types/order";
import OrderStatusBadge from "./OrderStatusBadge";

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  onDelete?: () => void;
}

export default function OrderCard({
  order,
  onPress,
  onDelete,
}: OrderCardProps) {
  const serviceText =
    order.order_items && order.order_items.length > 0
      ? order.order_items
          .map((item) => {
            const serviceName = item.services?.name ?? "Unknown Service";
            return item.qty && item.qty > 1
              ? `${serviceName} x${item.qty}`
              : serviceName;
          })
          .join(", ")
      : "-";

  const total =
    order.order_items?.reduce((sum, item) => {
      return sum + Number(item.subtotal);
    }, 0) ?? 0;

  const formattedDate = order.order_date
    ? new Date(order.order_date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

  const status = (order.service_status as any) ?? "Waiting";

  return (
    <Pressable
      onPress={onPress}
      className="mb-4 rounded-2xl border border-gray-200 bg-white p-4"
      style={({ pressed }) => ({
        opacity: pressed ? 0.75 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
      })}
    >
      {/* TOP */}
      <View className="mb-[16px] flex-row items-start justify-between">
        <View>
          <Text className="text-base font-bold text-gray-900">#{order.id}</Text>
          <Text className="mt-1 text-xs text-gray-400">{formattedDate}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <OrderStatusBadge status={status} />

          {/* Tombol Delete (hanya muncul kalau onDelete ada) */}
          {onDelete && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onDelete();
              }}
              className="h-8 w-8 items-center justify-center rounded-full bg-red-50"
              hitSlop={8}
            >
              <Trash2 size={16} color="#EF4444" />
            </Pressable>
          )}
        </View>
      </View>

      {/* INFORMATION */}
      <View className="gap-3">
        {/* CUSTOMER */}
        <View className="flex-row items-center">
          <View className="mr-[10px] h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-gray-100">
            <User size={16} color="#6B7280" />
          </View>
          <View className="flex-1">
            <Text className="mb-[2px] text-[11px] text-gray-400">Customer</Text>
            <Text
              className="text-sm font-medium text-gray-700"
              numberOfLines={1}
            >
              {order.customers?.name ?? "-"}
            </Text>
          </View>
        </View>

        {/* VEHICLE */}
        <View className="flex-row items-center">
          <View className="mr-[10px] h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-gray-100">
            <Car size={16} color="#6B7280" />
          </View>
          <View className="flex-1">
            <Text className="mb-[2px] text-[11px] text-gray-400">Vehicle</Text>
            <Text
              className="text-sm font-medium text-gray-700"
              numberOfLines={1}
            >
              {order.vehicles
                ? `${order.vehicles.brand} ${order.vehicles.model}`
                : "-"}
            </Text>
            <Text className="mt-[2px] text-xs text-gray-400" numberOfLines={1}>
              {order.vehicles?.plate_number ?? "-"}
            </Text>
          </View>
        </View>
      </View>

      {/* BOTTOM */}
      <View className="mt-[16px] flex-row items-center border-t border-gray-100 pt-[14px]">
        <View className="min-w-0 flex-1 pr-2">
          <Text className="mb-[3px] text-[11px] text-gray-400">Service</Text>
          <Text
            className="text-[13px] font-medium text-gray-600"
            numberOfLines={2}
          >
            {serviceText}
          </Text>
        </View>

        <View className="mr-3 items-end">
          <Text className="mb-[3px] text-[11px] text-gray-400">Total</Text>
          <Text className="text-[15px] font-bold text-gray-900">
            Rp {total.toLocaleString("id-ID")}
          </Text>
        </View>

        <View className="h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-gray-100">
          <ChevronRight size={18} color="#6B7280" />
        </View>
      </View>
    </Pressable>
  );
}
