import React, { useContext, useState, useEffect } from "react";
import { View, Text, Switch, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { ThemeContext } from "../../contexts/ThemeContext";
import API from "../../api";

const SettingsScreen = () => {
  const { currentTheme, toggleTheme } = useContext(ThemeContext);

  // Notification states
  const [geofenceEnter, setGeofenceEnter] = useState(false);
  const [geofenceExit, setGeofenceExit] = useState(false);
  const [newPersonAdded, setNewPersonAdded] = useState(false);
  const [personLeft, setPersonLeft] = useState(false);
  const [taskAssigned, setTaskAssigned] = useState(false);
  const [taskAccepted, setTaskAccepted] = useState(false);
  const [taskDenied, setTaskDenied] = useState(false);

  // Fetch settings from backend
  const fetchSettings = async () => {
    try {
      const { data } = await API.get("/settings/current");
      if (data.notifications) {
        setGeofenceEnter(data.notifications.geofenceEnter || false);
        setGeofenceExit(data.notifications.geofenceExit || false);
        setNewPersonAdded(data.notifications.newPersonAdded || false);
        setPersonLeft(data.notifications.personLeft || false);
        setTaskAssigned(data.notifications.taskAssigned || false);
        setTaskAccepted(data.notifications.taskAccepted || false);
        setTaskDenied(data.notifications.taskDenied || false);
      }
    } catch (error) {
      console.log("Error fetching settings:", error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const colors = currentTheme === "dark"
    ? { background: "#121212", text: "#fff", card: "#1e1e1e", switchTrackTrue: "#4DD0E1", switchThumb: "#4DD0E1" }
    : { background: "#fff", text: "#000", card: "#f8f8f8", switchTrackTrue: "#39e0e0ff", switchThumb: "#f3f0ea" };

  // Toggle notification and save backend
  const handleToggle = async (setter, value, key) => {
    setter(!value);
    try {
      await API.post("/settings/notifications", { [key]: !value });
    } catch (error) {
      console.log("Error updating notification:", error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.section, { color: colors.text }]}>Theme</Text>
      <View style={styles.row}>
        <Text style={{ color: colors.text }}>Dark Mode</Text>
        <Switch
          value={currentTheme === "dark"}
          onValueChange={() => toggleTheme(currentTheme === "dark" ? "light" : "dark")}
          trackColor={{ true: colors.switchTrackTrue, false: "#ccc" }}
          thumbColor={colors.switchThumb}
        />
      </View>

      <Text style={[styles.section, { color: colors.text }]}>Notifications</Text>

      <View style={styles.row}>
        <Text style={{ color: colors.text }}>Person Enters Geofence</Text>
        <Switch
          value={geofenceEnter}
          onValueChange={() => handleToggle(setGeofenceEnter, geofenceEnter, "geofenceEnter")}
          trackColor={{ true: colors.switchTrackTrue, false: "#ccc" }}
          thumbColor={colors.switchThumb}
        />
      </View>

      <View style={styles.row}>
        <Text style={{ color: colors.text }}>Person Exits Geofence</Text>
        <Switch
          value={geofenceExit}
          onValueChange={() => handleToggle(setGeofenceExit, geofenceExit, "geofenceExit")}
          trackColor={{ true: colors.switchTrackTrue, false: "#ccc" }}
          thumbColor={colors.switchThumb}
        />
      </View>

      <View style={styles.row}>
        <Text style={{ color: colors.text }}>New Person Added</Text>
        <Switch
          value={newPersonAdded}
          onValueChange={() => handleToggle(setNewPersonAdded, newPersonAdded, "newPersonAdded")}
          trackColor={{ true: colors.switchTrackTrue, false: "#ccc" }}
          thumbColor={colors.switchThumb}
        />
      </View>

      <View style={styles.row}>
        <Text style={{ color: colors.text }}>Person Left</Text>
        <Switch
          value={personLeft}
          onValueChange={() => handleToggle(setPersonLeft, personLeft, "personLeft")}
          trackColor={{ true: colors.switchTrackTrue, false: "#ccc" }}
          thumbColor={colors.switchThumb}
        />
      </View>

      <View style={styles.row}>
        <Text style={{ color: colors.text }}>Task Assigned</Text>
        <Switch
          value={taskAssigned}
          onValueChange={() => handleToggle(setTaskAssigned, taskAssigned, "taskAssigned")}
          trackColor={{ true: colors.switchTrackTrue, false: "#ccc" }}
          thumbColor={colors.switchThumb}
        />
      </View>

      <View style={styles.row}>
        <Text style={{ color: colors.text }}>Task Accepted</Text>
        <Switch
          value={taskAccepted}
          onValueChange={() => handleToggle(setTaskAccepted, taskAccepted, "taskAccepted")}
          trackColor={{ true: colors.switchTrackTrue, false: "#ccc" }}
          thumbColor={colors.switchThumb}
        />
      </View>

      <View style={styles.row}>
        <Text style={{ color: colors.text }}>Task Declined</Text>
        <Switch
          value={taskDenied}
          onValueChange={() => handleToggle(setTaskDenied, taskDenied, "taskDenied")}
          trackColor={{ true: colors.switchTrackTrue, false: "#ccc" }}
          thumbColor={colors.switchThumb}
        />
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  section: { fontSize: 16, fontWeight: "600", marginVertical: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
});
