import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ThemeContext } from "../contexts/ThemeContext";

const TaskCard = ({ task, onAccept, onDecline }) => {
  const { colors } = useContext(ThemeContext);

  return (
    <View style={[styles.card, { backgroundColor: colors.cardColor, shadowColor: colors.textColor }]}>
      <Text style={[styles.title, { color: colors.textColor }]}>{task.title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{task.description}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Assigned to: {task.assignedTo.name}
      </Text>
      <Text style={[styles.deadline, { color: colors.textSecondary }]}>
        Deadline: {new Date(task.updatedAt).toLocaleString()}
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => onAccept(task._id)}
        >
          <Text style={[styles.buttonText, { color: colors.textColor }]}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={() => onDecline(task._id)}
        >
          <Text style={[styles.buttonText, { color: colors.textColor }]}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TaskCard;

const styles = StyleSheet.create({
  card: {
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 10,
    borderRadius: 10,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  description: { fontSize: 14, marginBottom: 5 },
  deadline: { fontSize: 12, marginBottom: 10 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between" },
  button: { padding: 10, borderRadius: 5, flex: 1, marginHorizontal: 5, alignItems: "center" },
  buttonText: { fontWeight: "bold" },
});
