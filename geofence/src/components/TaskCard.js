import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ThemeContext } from "../contexts/ThemeContext";

const TaskCard = ({ task, onAccept, onDecline, onDone, onEdit, onDelete, isAdmin, currentUserId }) => {
  const { colors } = useContext(ThemeContext);
  const isAssignee = String(task.assignedTo?._id || task.assignedTo) === String(currentUserId);

  return (
    <View style={[styles.card, { backgroundColor: colors.cardColor, shadowColor: colors.textColor }]}>
      <Text style={[styles.title, { color: colors.textColor }]}>{task.description || task.title}</Text>
      <Text style={[styles.title, { color: colors.textColor }]}>{task.status}</Text>

      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Assigned to: {task.assignedTo?.name || task.assignedTo}
      </Text>

      <Text style={[styles.deadline, { color: colors.textSecondary }]}>
        Deadline: {task.deadline ? new Date(task.deadline).toLocaleString() : (new Date(task.updatedAt)).toLocaleString()}
      </Text>

      {/* show acceptance state visually */}
      {task.accepted && (
        <Text style={[styles.acceptedText, { color: colors.primary }]}>Accepted • {task.acceptedAt ? new Date(task.acceptedAt).toLocaleString() : ""}</Text>
      )}

      <View style={styles.buttonContainer}>
        {isAssignee && (
          <>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => onAccept && onAccept(task._id)}
            >
              <Text style={[styles.buttonText, { color: colors.textColor }]}>Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={() => onDecline && onDecline(task._id)}
            >
              <Text style={[styles.buttonText, { color: colors.textColor }]}>Decline</Text>
            </TouchableOpacity>

            {/* Show Done button only if it's not completed yet */}
            {task.status !== "completed" && (
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: colors.surfaceColor }]}
                onPress={() => onDone && onDone(task._id)}
              >
                <Text style={[styles.doneButtonText, { color: colors.textColor }]}>Mark Done</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {isAdmin && (
          <>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => onEdit && onEdit(task)}>
              <Text style={[styles.buttonText, { color: colors.textColor }]}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={() => onDelete && onDelete(task._id)}>
              <Text style={[styles.buttonText, { color: colors.textColor }]}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
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
  acceptedText: { fontSize: 12, marginBottom: 6 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap" },
  button: { padding: 10, borderRadius: 5, margin: 4, minWidth: 80, alignItems: "center" },
  doneButton: { padding: 10, borderRadius: 5, margin: 4, minWidth: 100, alignItems: "center" },
  buttonText: { fontWeight: "bold" },
  doneButtonText: { fontWeight: "700" },
});
