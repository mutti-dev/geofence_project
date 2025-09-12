import React, { useEffect, useState, useContext } from "react";
import { SocketProvider } from "../contexts/SocketContext";
import { registerForPushNotificationsAsync, addNotificationListeners } from "../services/notifications/PushNotificationService";
import { AuthContext } from "../contexts/AuthContext";

export default function AppProviders({ children }) {
  const { user } = useContext(AuthContext);
  const [expoPushToken, setExpoPushToken] = useState(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    const removeListeners = addNotificationListeners(
      notification => console.log("Notification received:", notification),
      response => console.log("Notification tapped:", response)
    );

    return removeListeners;
  }, []);

  return (
    <SocketProvider user={user}>
      {children}
    </SocketProvider>
  );
}
