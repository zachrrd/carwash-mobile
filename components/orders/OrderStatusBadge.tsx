import { Text, View } from "react-native";
import type { OrderStatus } from "@/types/order";

type Props = {
  status: OrderStatus | string | null | undefined;
};

export default function OrderStatusBadge({ status }: Props) {
  const normalizedStatus = (status ?? "WAITING").toUpperCase();

  const getStyleAndLabel = () => {
    switch (normalizedStatus) {
      case "WAITING":
        return {
          label: "Waiting",
          container: "bg-amber-50 border border-amber-200",
          dot: "bg-amber-500",
          text: "text-amber-700",
        };
      case "CONFIRMED":
        return {
          label: "Confirmed",
          container: "bg-blue-50 border border-blue-200",
          dot: "bg-blue-600",
          text: "text-blue-700",
        };
      case "IN_PROGRESS":
        return {
          label: "In Progress",
          container: "bg-orange-50 border border-orange-200",
          dot: "bg-orange-500",
          text: "text-orange-700",
        };
      case "COMPLETED":
        return {
          label: "Completed",
          container: "bg-emerald-50 border border-emerald-200",
          dot: "bg-emerald-600",
          text: "text-emerald-700",
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          container: "bg-rose-50 border border-rose-200",
          dot: "bg-rose-500",
          text: "text-rose-700",
        };
      default:
        return {
          label: status ?? "-",
          container: "bg-gray-100 border border-gray-200",
          dot: "bg-gray-500",
          text: "text-gray-700",
        };
    }
  };

  const style = getStyleAndLabel();

  return (
    <View
      className={`flex-row items-center rounded-full px-[10px] py-[4px] ${style.container}`}
    >
      <View className={`mr-[6px] h-[6px] w-[6px] rounded-full ${style.dot}`} />
      <Text className={`text-[11px] font-semibold ${style.text}`}>
        {style.label}
      </Text>
    </View>
  );
}
