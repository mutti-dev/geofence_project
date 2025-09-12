import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import API from "../../api";
import { AuthContext } from "../../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AssignTaskScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [description, setDescription] = useState("");
  const [deadlineDays, setDeadlineDays] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const token = user?.token || (await AsyncStorage.getItem("token"));
      if (!token) return Alert.alert("Error", "Not authenticated");

      const { data } = await API.get("/circles/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Fetched members:", data);
      setMembers(data || []);
    } catch (err) {
      console.log("fetchMembers error", err?.response?.data || err.message);
      Alert.alert("Error", "Unable to load members");
    } finally {
      setLoading(false);
    }
  };

  const assignTask = async () => {
    if (!selected) return Alert.alert("Please select a member");
    if (!description.trim()) return Alert.alert("Please enter a description");
    setSubmitting(true);
    try {
      const token = user?.token || (await AsyncStorage.getItem("token"));
      if (!token) return Alert.alert("Error", "Not authenticated");
      const deadline = new Date(
        Date.now() + deadlineDays * 24 * 60 * 60 * 1000
      ).toISOString();
      const payload = {
        assignedTo: selected._id || selected,
        description,
        deadline,
      };
      const { data } = await API.post("/tasks", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert("Success", "Task assigned");
      navigation.goBack();
    } catch (err) {
      console.log("assignTask error", err?.response?.data || err.message);
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to assign task"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderMember = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.memberItem,
        selected && selected._id === item._id ? styles.memberSelected : null,
      ]}
      onPress={() => setSelected(item)}
    >
      <Text style={styles.memberName}>{item.name}</Text>
      <Text style={styles.memberRole}>{item.role}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Assign Task</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Select Member</Text>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <FlatList
            data={members.filter((member) => member.role === "member")}
            keyExtractor={(i) => i._id}
            renderItem={renderMember}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginVertical: 8 }}
          />
        )}

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter task description"
        />

        <Text style={styles.label}>Deadline (days from now)</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => setDeadlineDays(Math.max(1, deadlineDays - 1))}
          >
            <Text style={styles.stepText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.deadlineText}>{deadlineDays} day(s)</Text>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => setDeadlineDays(deadlineDays + 1)}
          >
            <Text style={styles.stepText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.assignBtn}
          onPress={assignTask}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.assignText}>Assign Task</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: { padding: 16, borderBottomWidth: 1, borderColor: "#eee" },
  title: { fontSize: 20, fontWeight: "bold" },
  section: { padding: 16 },
  label: { fontSize: 14, marginTop: 12, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  row: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  stepBtn: { padding: 8, backgroundColor: "#ddd", borderRadius: 6 },
  stepText: { fontSize: 20 },
  deadlineText: { marginHorizontal: 12, fontSize: 16 },
  assignBtn: {
    marginTop: 16,
    backgroundColor: "#008080",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  assignText: { color: "#fff", fontWeight: "600" },
  memberItem: {
    padding: 12,
    marginRight: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  memberSelected: { borderColor: "#008080", borderWidth: 2 },
  memberName: { fontWeight: "600" },
  memberRole: { fontSize: 12, opacity: 0.7 },
});
