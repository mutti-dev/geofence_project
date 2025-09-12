import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import API from "../../api";

export default function NotificationScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await API.get("/notifications", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const fetchedNotifications = response.data.notifications || [];
      console.log("Fetched notifications", fetchedNotifications);
      setNotifications(fetchedNotifications);

      // Count unread notifications
      const unread = fetchedNotifications.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.log(
        "Fetch notifications error",
        err.response?.data || err.message
      );
      Alert.alert("Error", "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Socket listeners for real-time notifications
  useEffect(() => {
    if (!socket) return;

    // Listen for new notifications
    socket.on("newNotification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    // Listen for geofence notifications
    socket.on("geofenceNotification", (data) => {
      const notification = {
        _id: Date.now().toString(),
        type: "geofenceEnter",
        title: "Geofence Alert",
        message: `${data.memberName} has ${
          data.type === "entry" ? "entered" : "exited"
        } ${data.geofenceName}`,
        read: false,
        createdAt: new Date(),
        data: {
          geofenceId: data.geofenceId,
          geofenceName: data.geofenceName,
          memberId: data.memberId,
          memberName: data.memberName,
          eventType: data.type,
        },
      };
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    // Listen for admin geofence alerts
    socket.on("adminGeofenceAlert", (data) => {
      const notification = {
        _id: Date.now().toString(),
        type: "geofenceEnter",
        title: "Zone Alert",
        message: `${data.memberName} has ${
          data.type === "entry" ? "entered" : "exited"
        } ${data.geofenceName}`,
        read: false,
        createdAt: new Date(),
        data: {
          geofenceId: data.geofenceId,
          geofenceName: data.geofenceName,
          memberId: data.memberId,
          memberName: data.memberName,
          eventType: data.type,
        },
      };
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off("newNotification");
      socket.off("geofenceNotification");
      socket.off("adminGeofenceAlert");
    };
  }, [socket]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await API.patch(`/notifications/${notificationId}/read`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.log("Mark as read error", err.response?.data || err.message);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await API.patch("/notifications/mark-all-read", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.log("Mark all as read error", err.response?.data || err.message);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await API.delete(`/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.log(
        "Delete notification error",
        err.response?.data || err.message
      );
    }
  };

  // Handle notification press
  const handleNotificationPress = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Handle different notification types
    switch (notification.type) {
      case "geofenceEnter":
      case "geofenceExit":
        // Navigate to live map
        navigation.navigate("LiveMap");
        break;
      case "taskAssigned":
        // Navigate to tasks
        navigation.navigate("TaskScreen");
        break;
      default:
        // Show details
        Alert.alert(notification.title, notification.message);
    }
  };

  // Refresh notifications
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case "geofenceEnter":
      case "geofenceExit":
        return "📍";
      case "taskAssigned":
        return "📋";
      case "taskAccepted":
        return "✅";
      case "taskDenied":
        return "❌";
      case "newPersonAdded":
        return "👤";
      case "personLeft":
        return "👋";
      default:
        return "🔔";
    }
  };

  // Get notification color
  const getNotificationColor = (type) => {
    switch (type) {
      case "geofenceEnter":
        return "#4CAF50";
      case "geofenceExit":
        return "#FF9800";
      case "taskAssigned":
        return "#2196F3";
      case "taskAccepted":
        return "#4CAF50";
      case "taskDenied":
        return "#F44336";
      case "newPersonAdded":
        return "#9C27B0";
      case "personLeft":
        return "#FF5722";
      default:
        return "#607D8B";
    }
  };

  // Format time
  const formatTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diff = Math.floor((now - notificationDate) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return notificationDate.toLocaleDateString();
  };

  // Render notification item
  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationIcon}>
            {getNotificationIcon(item.type)}
          </Text>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationTime}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteNotification(item._id)}
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6A1B9A" />

      {/* Header */}
      <LinearGradient colors={["#6A1B9A", "#8E24AA"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadCount}>{unreadCount} unread</Text>
          )}
        </View>
        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
          <Text style={styles.markAllButtonText}>Mark All Read</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Notifications List */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6A1B9A" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              You'll receive notifications about geofence events, tasks, and
              more.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item._id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#6A1B9A"]}
                tintColor="#6A1B9A"
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  unreadCount: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  markAllButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  listContainer: {
    padding: 15,
  },
  notificationItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: "#6A1B9A",
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: "#666",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6A1B9A",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  deleteButtonText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "bold",
  },
});
