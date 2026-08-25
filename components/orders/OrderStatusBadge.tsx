import { Text, View } from "react-native";

import type { OrderStatus } from "@/types/order";

type Props = {
  status: OrderStatus;
};

export default function OrderStatusBadge({ status }: Props) {
  const statusStyle = {
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
  }[status];

  return (
    <View
      className={`flex-row items-center rounded-full px-[9px] py-[6px] ${statusStyle.container}`}
    >
      <View
        className={`mr-[6px] h-[6px] w-[6px] rounded-full ${statusStyle.dot}`}
      />

      <Text className={`text-[11px] font-semibold ${statusStyle.text}`}>
        {status}
      </Text>
    </View>
  );
}
