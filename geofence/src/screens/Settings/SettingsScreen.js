import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  AppState,
  Linking,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import SettingButton from "../../components/SettingButton";
import { ThemeContext } from "../../contexts/ThemeContext";
import { MaterialIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import * as Location from "expo-location";
import API from "../../api";
import { AuthContext } from "../../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SettingScreen = () => {
  const { colors, currentTheme, toggleTheme } = useContext(ThemeContext) || {};
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation();

  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(
    currentTheme === "dark"
  );
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);

  // Notification states
  const [geofenceEnter, setGeofenceEnter] = useState(false);
  const [geofenceExit, setGeofenceExit] = useState(false);
  const [newPersonAdded, setNewPersonAdded] = useState(false);
  const [personLeft, setPersonLeft] = useState(false);
  const [taskAssigned, setTaskAssigned] = useState(false);
  const [taskAccepted, setTaskAccepted] = useState(false);
  const [taskDenied, setTaskDenied] = useState(false);

  useEffect(() => {
    setIsDarkModeEnabled(currentTheme === "dark");
  }, [currentTheme]);

  useEffect(() => {
    navigation.setOptions({
      title: "Settings",
      headerStyle: { backgroundColor: colors.surfaceColor },
      headerTintColor: colors.textColor,
    });
  }, [navigation, colors]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    toggleTheme(newTheme);
    saveNotificationSettings();
  };

  // Toggle location
  const toggleLocation = async () => {
    if (!isLocationEnabled) {
      let { status } = await Location.getForegroundPermissionsAsync();

      if (status === "granted") {
        try {
          let loc = await Location.getCurrentPositionAsync({});
          setIsLocationEnabled(true);
          saveLocationSettings(true, loc);
        } catch (error) {
          console.error("Error getting location:", error);
          Alert.alert("Error", "Could not get current location");
        }
      } else if (status === "denied") {
        Alert.alert(
          "Permission Required",
          "Location access is denied. Please enable it in settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Go to Settings",
              onPress: async () => await Linking.openSettings(),
            },
          ]
        );
      } else {
        let { status: requestStatus } =
          await Location.requestForegroundPermissionsAsync();
        if (requestStatus === "granted") {
          let loc = await Location.getCurrentPositionAsync({});
          setIsLocationEnabled(true);
          saveLocationSettings(true, loc);
        } else {
          setIsLocationEnabled(false);
        }
      }
    } else {
      setIsLocationEnabled(false);
      saveLocationSettings(false, null);
    }
  };

  // Save notification settings
  const saveNotificationSettings = async () => {
    try {
      const token = user?.token || (await AsyncStorage.getItem("token"));
      if (!token) return;

      const notificationSettings = {
        notifications: {
          geofenceEnter,
          geofenceExit,
          newPersonAdded,
          personLeft,
          taskAssigned,
          taskAccepted,
          taskDenied,
        },
        theme: currentTheme,
      };

      await API.put("/users/settings", notificationSettings, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error(
        "Error saving notification settings:",
        error?.response?.data || error.message
      );
    }
  };

  // Save location settings
  const saveLocationSettings = async (enabled, location) => {
    try {
      const token = user?.token || (await AsyncStorage.getItem("token"));
      if (!token) return;

      const locationSettings = {
        locationEnabled: enabled,
        location: location
          ? {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: new Date().toISOString(),
            }
          : null,
      };

      await API.put("/users/settings", locationSettings, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error(
        "Error saving location settings:",
        error?.response?.data || error.message
      );
    }
  };

  const handleNotificationToggle = (setter, currentValue) => {
    setter(!currentValue);
    saveNotificationSettings();
  };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (next) => {
      if (next === "active") {
        let { status } = await Location.getForegroundPermissionsAsync();
        setIsLocationEnabled(status === "granted");
      }
    });
    return () => subscription?.remove();
  }, []);

  return (
    <View
      style={[styles.mainContainer, { backgroundColor: colors.backgroundColor }]}
    >
      <ScrollView style={{ backgroundColor: colors.backgroundColor }}>
        <View style={styles.container}>
          {/* Theme Switch */}
          <Text style={[styles.title, { color: colors.textColor }]}>
            Theme Switch
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.cardColor }]}
          >
            <Text style={{ color: colors.textColor }}>
              <MaterialIcons name="dark-mode" size={20} color={colors.accent} />{" "}
              Dark Mode
            </Text>
            <Switch
              trackColor={{
                false: colors.switchTrackFalse,
                true: colors.switchTrackTrue,
              }}
              thumbColor={isDarkModeEnabled ? colors.primary : colors.switchThumb}
              onValueChange={toggleDarkMode}
              value={isDarkModeEnabled}
            />
          </TouchableOpacity>

          {/* Theme Setting */}
          <Text style={[styles.title, { color: colors.textColor }]}>
            Theme Setting
          </Text>
          <SettingButton
            title="Light"
            icon="lightbulb-on"
            onPress={() => toggleTheme("light")}
            isActive={currentTheme === "light"}
            colors={colors}
          />
          <SettingButton
            title="Dark"
            icon="lightbulb-off"
            onPress={() => toggleTheme("dark")}
            isActive={currentTheme === "dark"}
            colors={colors}
          />
          <SettingButton
            title="System"
            icon="theme-light-dark"
            onPress={() => toggleTheme("system")}
            isActive={currentTheme === "system"}
            colors={colors}
          />

          {/* Notifications */}
          <Text style={[styles.title, { color: colors.textColor }]}>
            Notifications
          </Text>
          {[
            { label: "Geofence Enter", state: geofenceEnter, setter: setGeofenceEnter },
            { label: "Geofence Exit", state: geofenceExit, setter: setGeofenceExit },
            { label: "New Person Added", state: newPersonAdded, setter: setNewPersonAdded },
            { label: "Person Left", state: personLeft, setter: setPersonLeft },
            { label: "Task Assigned", state: taskAssigned, setter: setTaskAssigned },
            { label: "Task Accepted", state: taskAccepted, setter: setTaskAccepted },
            { label: "Task Denied", state: taskDenied, setter: setTaskDenied },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.button, { backgroundColor: colors.cardColor }]}
            >
              <Text style={{ color: colors.textColor }}>{item.label}</Text>
              <Switch
                trackColor={{
                  false: colors.switchTrackFalse,
                  true: colors.switchTrackTrue,
                }}
                thumbColor={item.state ? colors.primary : colors.switchThumb}
                onValueChange={() => handleNotificationToggle(item.setter, item.state)}
                value={item.state}
              />
            </TouchableOpacity>
          ))}

          {/* Location */}
          <Text style={[styles.title, { color: colors.textColor }]}>Location</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.cardColor }]}
          >
            <Text style={{ color: colors.textColor }}>
              <Ionicons name="location-sharp" size={20} color={colors.accent} />{" "}
              Location Access
            </Text>
            <Switch
              trackColor={{
                false: colors.switchTrackFalse,
                true: colors.switchTrackTrue,
              }}
              thumbColor={isLocationEnabled ? colors.primary : colors.switchThumb}
              onValueChange={toggleLocation}
              value={isLocationEnabled}
            />
          </TouchableOpacity>

          {/* Privacy Settings */}
          <Text style={[styles.title, { color: colors.textColor }]}>
            Privacy Setting
          </Text>
          <TouchableOpacity
            style={[
              styles.privacyUpdate,
              { backgroundColor: colors.cardColor, borderColor: colors.borderColor },
            ]}
            onPress={() => navigation.navigate("Profile")}
          >
            <MaterialIcons name="mode-edit" size={20} color={colors.accent} />
            <Text style={[styles.privacyText, { color: colors.textColor }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: colors.borderColor }]}
            onPress={logout}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={[styles.logoutText, { color: colors.accent }]}>
                Logout
              </Text>
              <AntDesign name="logout" color={colors.primary} size={18} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingScreen;

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  container: { flex: 1, padding: 16, paddingTop: 40 },
  title: { fontSize: 16, fontWeight: "600", marginVertical: 15 },
  button: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  privacyUpdate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  privacyText: { fontWeight: "500", fontSize: 14 },
  logoutButton: {
    borderWidth: 1,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 40,
  },
  logoutText: { fontSize: 18 },
});
