import { io, Socket } from "socket.io-client";
import * as SecureStore from "expo-secure-store";

export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL || "http://192.168.18.250:5000";

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});

export const connectSocket = async () => {
  try {
    const token = await SecureStore.getItemAsync("token");

    if (!token) {
      return;
    }

    socket.auth = {
      token,
    };

    if (!socket.connected) {
      socket.connect();
    }
  } catch (error) {
    console.error("connectSocket error:", error);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
