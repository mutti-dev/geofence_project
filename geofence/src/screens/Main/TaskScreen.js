import React, { useEffect, useState } from "react";
import { 
  View, 
  FlatList, 
  StyleSheet, 
  Alert, 
  Text, 
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar
} from "react-native";
import TaskCard from "../../components/TaskCard";
import API from "../../api";
import io from "socket.io-client";

const SOCKET_URL = "https://5825c59b9163.ngrok-free.app";

const TaskScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const fetchTasks = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      
      const { data } = await API.get("/tasks/my-tasks");
      setTasks(data);
    } catch (error) {
      console.log("Error fetching tasks:", error);
      Alert.alert("Error", "Failed to fetch tasks. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAccept = async (taskId) => {
    try {
      await API.post(`/tasks/${taskId}/accept`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      Alert.alert("Success", "Task accepted successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to accept task");
    }
  };

  const handleDecline = async (taskId) => {
    try {
      await API.post(`/tasks/${taskId}/decline`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      Alert.alert("Success", "Task declined successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to decline task");
    }
  };

  const onRefresh = () => {
    fetchTasks(true);
  };

  useEffect(() => {
    fetchTasks();

    // Socket for real-time task assignment
    const socket = io(SOCKET_URL);
    
    socket.on("connect", () => {
      setSocketConnected(true);
      console.log("Socket connected");
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
      console.log("Socket disconnected");
    });

    socket.on("taskAssigned", (newTask) => {
      setTasks((prev) => [newTask, ...prev]);
      Alert.alert("New Task", `You have been assigned: ${newTask.title}`);
    });

    return () => {
      socket.disconnect();
      setSocketConnected(false);
    };
  }, []);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>No Tasks Available</Text>
      <Text style={styles.emptySubtitle}>
        You're all caught up! New tasks will appear here when they're assigned to you.
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={() => fetchTasks()}>
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
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} pending
        </Text>
      </View>
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: socketConnected ? '#27ae60' : '#e74c3c' }]} />
        <Text style={styles.statusText}>
          {socketConnected ? 'Connected' : 'Offline'}
        </Text>
      </View>
    </View>
  );

  const renderTaskItem = ({ item, index }) => (
    <View style={[styles.taskItemContainer, { marginTop: index === 0 ? 0 : 12 }]}>
      <TaskCard 
        task={item} 
        onAccept={handleAccept} 
        onDecline={handleDecline} 
      />
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
      
      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        renderItem={renderTaskItem}
        contentContainerStyle={[
          styles.listContainer,
          tasks.length === 0 && styles.listContainerEmpty
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#008080']}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
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
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  refreshButton: {
    backgroundColor: '#008080',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#008080',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});