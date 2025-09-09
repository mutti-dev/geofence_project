import React, { createContext, useState, useEffect, useContext } from "react";
import API from "../api";
import { AuthContext } from "./AuthContext";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  const [notifications, setNotifications] = useState({
    geofenceEnter: false,
    geofenceExit: false,
    newPersonAdded: false,
    personLeft: false,
    taskAssigned: false,
    taskAccepted: false,
    taskDenied: false,
  });

  // Load user notification settings from backend
  const loadNotificationSettings = async () => {
    if (!user) return;

    try {
      const { data } = await API.get(`/settings/${user._id}/notifications`);
      if (data && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
    }
  };

  // Save user notification settings to backend
  const saveNotificationSettings = async (updatedNotifications) => {
    if (!user) return;

    try {
      await API.post(`/settings/notifications`, {
        userId: user._id,
        notifications: updatedNotifications,
      });
    } catch (error) {
      console.error("Error saving notification settings:", error);
    }
  };

  // Toggle a notification type
  const toggleNotification = (type) => {
    const updated = { ...notifications, [type]: !notifications[type] };
    setNotifications(updated);
    saveNotificationSettings(updated);
  };

  useEffect(() => {
    loadNotificationSettings();
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{ notifications, toggleNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
