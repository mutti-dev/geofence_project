import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const TaskCard = ({ task, onAccept, onDecline }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{task.title}</Text>
      <Text style={styles.description}>{task.description}</Text>
      <Text style={styles.description}>Assigned to: {task.assignedTo.name}</Text>
      <Text style={styles.deadline}>Deadline: {new Date(task.updatedAt).toLocaleString()}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, { backgroundColor: "#008080" }]} onPress={() => onAccept(task._id)}>
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: "#ff7f50" }]} onPress={() => onDecline(task._id)}>
          <Text style={styles.buttonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TaskCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  description: { fontSize: 14, marginBottom: 5 },
  deadline: { fontSize: 12, color: "#666", marginBottom: 10 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between" },
  button: { padding: 10, borderRadius: 5, flex: 1, marginHorizontal: 5, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
