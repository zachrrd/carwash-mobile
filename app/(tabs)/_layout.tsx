import { Tabs } from "expo-router";
import React from "react";
import { List, History, Menu, Users, Car } from "lucide-react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? "#FFFFFF" : "#111827",
        tabBarInactiveTintColor: isDark ? "#6B7280" : "#9CA3AF",
        tabBarStyle: {
          height: 65,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: isDark ? "#121212" : "#FFFFFF",
          borderTopWidth: 0.5,
          borderTopColor: isDark ? "#333333" : "#E5E7EB",
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginBottom: 4,
        },
      }}
    >
      {/* 1. Customers */}
      <Tabs.Screen
        name="customers"
        options={{
          title: "Customers",
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />

      {/* 2. Vehicles */}
      <Tabs.Screen
        name="vehicles"
        options={{
          title: "Vehicles",
          tabBarIcon: ({ color, size }) => <Car size={size} color={color} />,
        }}
      />

      {/* 3. Orders */}
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => <List size={size} color={color} />,
        }}
      />

      {/* 4. History */}
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <History size={size} color={color} />
          ),
        }}
      />

      {/* 5. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Menu size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
