import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../contexts/AuthContext";
import API from "../../api";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useSocket } from "../../contexts/SocketContext";
import { ThemeContext } from "../../contexts/ThemeContext";

const ManageFamilyScreen = () => {
  const { user } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const { colors } = useContext(ThemeContext);
  // console.log("Members:", members);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { socket, notifications, onlineUsers } = useSocket();

  const fetchMembers = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const token = user?.token || (await AsyncStorage.getItem("token"));
      if (!token) {
        Alert.alert("Error", "You are not logged in");
        return;
      }

      // Prefer circles endpoint to get members for the user's circle
      try {
        const { data: circles } = await API.get("/circles/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const myCircle = (circles || []).find(
          (c) =>
            String(c._id) === String(user?.circle) ||
            String(c.admin) === String(user?._id)
        );
        if (myCircle) {
          setMembers(myCircle.members || []);
          return;
        }
      } catch (err) {
        console.log(
          "circles/all failed, will try users/circle-members fallback",
          err?.response?.data || err.message
        );
      }

      // Fallback to older endpoint if available
      try {
        const { data } = await API.get("/users/circle-members", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMembers(data || []);
      } catch (error) {
        console.log(
          "Error fetching members (fallback):",
          error?.response?.data || error.message
        );
        setMembers([]);
      }
    } catch (error) {
      console.log("Error fetching members:", error);
      Alert.alert("Error", "Failed to fetch members");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const onRefresh = () => {
    fetchMembers(true);
  };

  const handleRemove = async (memberId) => {
    try {
      await API.delete(`/circles/${user.circle}/members/${memberId}`);
      setMembers(members.filter((m) => m._id !== memberId));
    } catch (err) {
      console.log("Remove member error", err.response?.data || err.message);
      Alert.alert("Error", "Failed to remove member");
    }
  };

  return (
    <ScreenWrapper>
      <View
        style={[styles.container, { backgroundColor: colors.backgroundColor }]}
      >
        <FlatList
          data={members}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const isOnline = onlineUsers?.includes(item._id);

            return (
              <View
                style={[styles.item, { backgroundColor: colors.cardColor }]}
              >
                <Text style={[styles.name, { color: colors.textColor }]}>
                  {item.name} {item.role === "admin" ? "(Admin)" : ""}
                </Text>
                <Text
                  style={[
                    isOnline ? styles.online : styles.offline,
                    { color: isOnline ? colors.success : colors.error },
                  ]}
                >
                  {isOnline ? "Online" : "Offline"}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={() => (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              No members
            </Text>
          )}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          contentContainerStyle={
            members.length === 0 ? { flex: 1, justifyContent: "center" } : {}
          }
        />
      </View>
    </ScreenWrapper>
  );
};

export default ManageFamilyScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  title: { fontSize: 18, fontWeight: "700" },
  generate: { backgroundColor: "#008080", padding: 10, borderRadius: 8 },
  generateText: { color: "#fff" },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontSize: 16 },
  remove: { padding: 8, backgroundColor: "#ff7f50", borderRadius: 6 },
  removeText: { color: "#fff" },
  online: {
    fontSize: 14,
    fontWeight: "700",
  },
  offline: {
    fontSize: 14,
    fontWeight: "700",
  },
});
