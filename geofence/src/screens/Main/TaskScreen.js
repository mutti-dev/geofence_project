import React, { useEffect, useState, useContext } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  Text,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import TaskCard from "../../components/TaskCard";
import API from "../../api";
import io from "socket.io-client";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TaskScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const navigation = useNavigation();
  const { user, logout } = useContext(AuthContext);

  const fetchTasks = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const token = user?.token || (await AsyncStorage.getItem("token"));
      if (!token) {
        setIsLoading(false);
        setIsRefreshing(false);
        Alert.alert("Error", "You are not logged in");
        return;
      }

      // always use /tasks/my which returns admin or member tasks based on server logic
      const { data } = await API.get("/tasks/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTasks(data || []);
    } catch (error) {
      console.log(
        "Error fetching tasks:",
        error?.response?.data || error.message
      );
      
      // Handle authentication errors
      if (error?.response?.status === 401) {
        Alert.alert("Session Expired", "Please log in again", [
          { text: "OK", onPress: () => logout() }
        ]);
        return;
      }
      
      Alert.alert("Error", "Failed to fetch tasks. Please try again.");
      setTasks([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAccept = async (taskId) => {
    try {
      const token = user?.token || (await AsyncStorage.getItem("token"));
      if (!token) {
        Alert.alert("Error", "You are not logged in");
        return;
      }

      await API.post(`/tasks/${taskId}/accept`);

      fetchTasks();
      Alert.alert("Success", "Task accepted successfully!");
    } catch (error) {
      console.log("accept error", error?.response?.data || error.message);
      
      // Handle authentication errors
      if (error?.response?.status === 401) {
        Alert.alert("Session Expired", "Please log in again", [
          { text: "OK", onPress: () => logout() }
        ]);
        return;
      }
      
      Alert.alert("Error", "Failed to accept task");
    }
  };

  const handleDecline = async (taskId) => {
    try {
      const token = user?.token || (await AsyncStorage.getItem("token"));
      if (!token) {
        Alert.alert("Error", "You are not logged in");
        return;
      }

      await API.post(`/tasks/${taskId}/decline`);
      fetchTasks();
      Alert.alert("Success", "Task declined successfully!");
    } catch (error) {
      console.log("decline error", error?.response?.data || error.message);
      
      // Handle authentication errors
      if (error?.response?.status === 401) {
        Alert.alert("Session Expired", "Please log in again", [
          { text: "OK", onPress: () => logout() }
        ]);
        return;
      }
      
      Alert.alert("Error", "Failed to decline task");
    }
  };

  const handleDelete = async (taskId) => {
    try {
      const token = user?.token || (await AsyncStorage.getItem("token"));
      if (!token) {
        Alert.alert("Error", "You are not logged in");
        return;
      }

      await API.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      Alert.alert("Success", "Task deleted");
    } catch (err) {
      console.log("delete error", err?.response?.data || err.message);
      
      // Handle authentication errors
      if (err?.response?.status === 401) {
        Alert.alert("Session Expired", "Please log in again", [
          { text: "OK", onPress: () => logout() }
        ]);
        return;
      }
      
      Alert.alert("Error", "Failed to delete task");
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const token = user?.token || (await AsyncStorage.getItem("token"));
      await API.put(
        `/tasks/${taskId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTasks();
      Alert.alert("Success", `Task marked as ${newStatus}`);
    } catch (err) {
      console.log("update status error", err?.response?.data || err.message);
      Alert.alert("Error", "Failed to update task status");
    }
  };

  const onRefresh = () => {
    fetchTasks(true);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>No Tasks Available</Text>
      <Text style={styles.emptySubtitle}>
        You're all caught up! New tasks will appear here when they're assigned
        to you.
      </Text>
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={() => fetchTasks()}
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#008080" />
      <Text style={styles.loadingText}>Loading your tasks...</Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <Text style={styles.headerSubtitle}>
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}{" "}
          {user?.role === "admin" ? "in circle" : "pending"}
        </Text>
      </View>
    </View>
  );

  const renderTaskItem = ({ item, index }) => (
    <View
      style={[styles.taskItemContainer, { marginTop: index === 0 ? 0 : 12 }]}
    >
      <TaskCard
        task={item}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onDelete={handleDelete}
        onUpdateStatus={handleUpdateStatus}
        isAdmin={user?.role === "admin"}
      />

      {user?.role === "admin" && (
        <View style={styles.adminActionRow}>
          <TouchableOpacity
            style={styles.adminActionBtn}
            onPress={() => handleUpdateStatus(item._id, "pending")}
          >
            <Text style={styles.adminActionText}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adminActionBtn}
            onPress={() => handleUpdateStatus(item._id, "accepted")}
          >
            <Text style={styles.adminActionText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adminActionBtn}
            onPress={() => handleUpdateStatus(item._id, "declined")}
          >
            <Text style={styles.adminActionText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adminActionBtn}
            onPress={() => handleUpdateStatus(item._id, "completed")}
          >
            <Text style={styles.adminActionText}>Complete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adminDeleteBtn}
            onPress={() => handleDelete(item._id)}
          >
            <Text style={styles.adminDeleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        {renderLoadingState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {renderHeader()}

      {user?.role === "admin" && (
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => navigation.navigate("AssignTask")}
        >
          <Text style={styles.assignButtonText}>+ Assign Task</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={
          user?.role === "admin"
            ? tasks // 🔹 admin sees all
            : tasks.filter((task) => task.status === "pending")
        }
        keyExtractor={(item) => item._id}
        renderItem={renderTaskItem}
        contentContainerStyle={[
          styles.listContainer,
          tasks.length === 0 && styles.listContainerEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#008080"]}
            tintColor="#008080"
            title="Pull to refresh"
            titleColor="#666"
          />
        }
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

export default TaskScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#6c757d",
    fontWeight: "500",
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  listContainerEmpty: {
    flex: 1,
  },
  taskItemContainer: {
    marginBottom: 12,
  },
  separator: {
    height: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  refreshButton: {
    backgroundColor: "#008080",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: "#008080",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  refreshButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  assignButton: {
    backgroundColor: "#008080",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  assignButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  adminActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  adminActionBtn: {
    flex: 1,
    paddingVertical: 8,
    marginRight: 6,
    backgroundColor: "#eceff1",
    borderRadius: 8,
    alignItems: "center",
  },
  adminActionText: {
    color: "#333",
    fontWeight: "600",
  },
  adminDeleteBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f44336",
    borderRadius: 8,
    alignItems: "center",
  },
  adminDeleteText: {
    color: "#fff",
    fontWeight: "700",
  },
});
