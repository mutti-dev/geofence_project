import React, { createContext, useContext, useEffect, useState } from "react";
import socket from "../sockets"; // your socket.io client instance
import { onLocationUpdate } from "../sockets/locationSocket";
import {
  joinNotificationRoom,
  onNotificationReceived,
} from "../sockets/notificationSocket";
import { AuthContext } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [locations, setLocations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  console.log("Online user:", onlineUsers);
  // console.log("SocketProvider rendered notifications:", notifications);
  const { user } = useContext(AuthContext);


useEffect(() => {
  // when user comes online
  const handleUserOnline = ({ userId }) => {
    setOnlineUsers((prev) => [...new Set([...prev, userId])]);
  };

  // when user goes offline
  const handleUserOffline = ({ userId }) => {
    setOnlineUsers((prev) => prev.filter((id) => id !== userId));
  };

  socket.on("userOnline", handleUserOnline);
  socket.on("userOffline", handleUserOffline);

  return () => {
    socket.off("userOnline", handleUserOnline);
    socket.off("userOffline", handleUserOffline);
    setOnlineUsers([]);
  };
}, []);


  useEffect(() => {
    if (!user || !user._id) {
      
      // If user logs out or is not logged in, disconnect socket
      if (socket.connected) {
        
        socket.disconnect();
        setIsConnected(false);
        setLocations([]);
        setNotifications([]);
      }
      return;
    }

    // ✅ User is logged in → connect socket
    if (!socket.connected) {
      socket.connect();
    }

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      setIsConnected(true);
      socket.emit("registerUser", { userId: user._id });
      // join notification room for this user
      joinNotificationRoom(user._id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
      setOnlineUsers([]);
    });

    // Location updates
    const locationHandler = (userLocation) => {
      setLocations((prev) => [...prev, userLocation]);
    };
    onLocationUpdate(locationHandler);

    // Notification updates
    const handleNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    };
    onNotificationReceived(handleNotification);

    // Cleanup when user changes or component unmounts
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("locationUpdate", locationHandler);
      socket.off("notificationReceived", handleNotification);
      socket.disconnect();
      setIsConnected(false);
    };
  }, [user]);

  const value = {
    socket,
    isConnected,
    locations,
    notifications,
    onlineUsers
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
