import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  const handleViewOrders = () => {
    router.dismissTo("/(tabs)/orders");
  };

  const handleCreateAnother = () => {
    router.dismissTo("/order/create");
  };

  return (
    <View className="flex-1 justify-between bg-gray-50">
      <View className="flex-1 items-center justify-center px-5">
        <View className="mb-6 h-[82px] w-[82px] items-center justify-center rounded-full bg-gray-900">
          <Check size={42} color="#FFFFFF" strokeWidth={3} />
        </View>

        <Text className="text-center text-[28px] font-bold text-gray-900">
          Order Created
        </Text>

        <Text className="mt-2 max-w-[280px] text-center text-sm leading-[21px] text-gray-500">
          Your order has been created successfully.
        </Text>

        {orderId ? (
          <View className="mt-[30px] w-full rounded-2xl border border-gray-200 bg-white p-[18px]">
            <Text className="mb-1.5 text-[13px] text-gray-500">Order ID</Text>
            <Text className="text-[17px] font-bold text-gray-900">
              #{orderId}
            </Text>

            <View className="mt-4">
              <Text className="mb-1.5 text-[13px] text-gray-500">
                Order Status
              </Text>
              <View className="flex-row items-center self-start rounded-full bg-gray-100 px-3 py-[7px]">
                <View className="mr-[7px] h-[7px] w-[7px] rounded-full bg-gray-900" />
                <Text className="text-[13px] font-semibold text-gray-900">
                  Waiting
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>

      <View className="gap-2.5 px-5 pb-8">
        <Pressable
          className="h-[52px] items-center justify-center rounded-[14px] bg-gray-900"
          onPress={handleViewOrders}
        >
          <Text className="text-[15px] font-bold text-white">View Orders</Text>
        </Pressable>

        <Pressable
          className="h-[52px] items-center justify-center rounded-[14px] border border-gray-200 bg-white"
          onPress={handleCreateAnother}
        >
          <Text className="text-[15px] font-semibold text-gray-900">
            Create Another Order
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
