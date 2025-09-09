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

const SettingScreen = () => {
  const themeContext = useContext(ThemeContext);
  const currentTheme = themeContext?.currentTheme || "light";
  const toggleTheme = themeContext?.toggleTheme || (() => {});
  const { user, logout } = useContext(AuthContext);

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

  const getThemeColors = () => {
    const isDark = currentTheme === "dark";
    return {
      backgroundColor: isDark ? "#121212" : "#ffffff",
      surfaceColor: isDark ? "#1e1e1e" : "#f8f9fa",
      cardColor: isDark ? "#2c2c2c" : "#ffffff",
      textColor: isDark ? "#ffffff" : "#000000",
      textSecondary: isDark ? "#cccccc" : "#666666",
      primary: "#008080",
      primaryLight: "#39e0e0ff",
      accent: "#FFA500",
      borderColor: isDark ? "#404040" : "#f0f0f0",
      switchTrackFalse: isDark ? "#404040" : "#008080",
      switchTrackTrue: isDark ? "#4DD0E1" : "#efd39eff",
      switchThumb: isDark ? "#4DD0E1" : "#f3f0eaff",
    };
  };

  const colors = getThemeColors();
  const navigation = useNavigation();

  useEffect(() => {
    setIsDarkModeEnabled(currentTheme === "dark");
  }, [currentTheme]);

  useEffect(() => {
    navigation.setOptions({
      title: "Settings",
      headerStyle: { backgroundColor: colors.backgroundColor },
      headerTintColor: colors.textColor,
    });
  }, [navigation, colors.backgroundColor, colors.textColor]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    toggleTheme(newTheme);
    setIsDarkModeEnabled(newTheme === "dark");
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
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => setIsLocationEnabled(false),
            },
            {
              text: "Go to Settings",
              onPress: async () => {
                await Linking.openSettings();
              },
            },
          ]
        );
      } else {
        let { status: requestStatus } =
          await Location.requestForegroundPermissionsAsync();
        if (requestStatus === "granted") {
          try {
            let loc = await Location.getCurrentPositionAsync({});
            setIsLocationEnabled(true);
            saveLocationSettings(true, loc);
          } catch (error) {
            console.error("Error getting location:", error);
            setIsLocationEnabled(false);
          }
        } else {
          setIsLocationEnabled(false);
        }
      }
    } else {
      setIsLocationEnabled(false);
      saveLocationSettings(false, null);
    }
  };

  // Save notification settings to backend
  const saveNotificationSettings = async () => {
    try {
      const notificationSettings = {
        userId: user?._id || user?.id || 'current_user_id',
        theme: currentTheme,
        notifications: {
          geofenceEnter,
          geofenceExit,
          newPersonAdded,
          personLeft,
          taskAssigned,
          taskAccepted,
          taskDenied,
        },
      };

      await API.post('/settings/notifications', notificationSettings);
    } catch (error) {
      console.error("Error saving notification settings:", error.message || error);
    }
  };

  // Save location settings to backend
  const saveLocationSettings = async (enabled, location) => {
    try {
      const locationSettings = {
        userId: user?._id || user?.id || 'current_user_id',
        locationEnabled: enabled,
        location: location
          ? {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: new Date().toISOString(),
            }
          : null,
      };

      await API.post('/settings/location', locationSettings);
    } catch (error) {
      console.error("Error saving location settings:", error.message || error);
    }
  };

  // Load settings from backend
  const loadSettings = async () => {
    try {
      const res = await API.get(`/settings/${user?._id || user?.id || 'current_user_id'}`);
      const settings = res.data;
      if (settings) {
        if (settings.notifications) {
          setGeofenceEnter(settings.notifications.geofenceEnter || false);
          setGeofenceExit(settings.notifications.geofenceExit || false);
          setNewPersonAdded(settings.notifications.newPersonAdded || false);
          setPersonLeft(settings.notifications.personLeft || false);
          setTaskAssigned(settings.notifications.taskAssigned || false);
          setTaskAccepted(settings.notifications.taskAccepted || false);
          setTaskDenied(settings.notifications.taskDenied || false);
        }
        if (settings.locationEnabled !== undefined)
          setIsLocationEnabled(settings.locationEnabled);
      }
    } catch (error) {
      console.error("Error loading settings:", error.message || error);
    }
  };

  const handleNotificationToggle = (setter, currentValue) => {
    const newValue = !currentValue;
    setter(newValue);
    setTimeout(() => saveNotificationSettings(), 100);
  };

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextState) => {
        if (nextState === "active") {
          let { status } = await Location.getForegroundPermissionsAsync();
          setIsLocationEnabled(status === "granted");
        }
      }
    );

    loadSettings();
    return () => subscription?.remove();
  }, []);

  return (
    <View
      style={[
        styles.mainContainer,
        { backgroundColor: colors.backgroundColor },
      ]}
    >
      <ScrollView
        style={{ backgroundColor: colors.backgroundColor, padding: 16 }}
      >
        <View style={styles.container}>
          <Text style={[styles.title, { color: colors.textColor }]}>
            Theme Switch
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primaryLight }]}
          >
            <Text style={{ color: colors.textColor }}>
              <MaterialIcons name="dark-mode" size={24} color={colors.accent} />{" "}
              Dark Mode
            </Text>
            <Switch
              trackColor={{
                false: colors.switchTrackFalse,
                true: colors.switchTrackTrue,
              }}
              thumbColor={
                isDarkModeEnabled ? colors.primary : colors.switchThumb
              }
              onValueChange={toggleDarkMode}
              value={isDarkModeEnabled}
              style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
            />
          </TouchableOpacity>

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

          <Text style={[styles.title, { color: colors.textColor }]}>
            Privacy Setting
          </Text>
          <TouchableOpacity
            style={[
              styles.privacyUpdate,
              {
                backgroundColor: colors.cardColor,
                borderColor: colors.borderColor,
              },
            ]}
            onPress={() => navigation.navigate("Profile")}
          >
            <MaterialIcons name="mode-edit" size={20} color={colors.accent} />
            <Text style={[styles.privacyText, { color: colors.textColor }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.privacyUpdate,
              {
                backgroundColor: colors.cardColor,
                borderColor: colors.borderColor,
              },
            ]}
            onPress={() => navigation.navigate("Profile")}
          >
            <MaterialIcons name="email" size={24} color={colors.primary} />
            <MaterialIcons name="password" size={24} color={colors.primary} />
            <Text style={[styles.privacyText, { color: colors.textColor }]}>
              Change Email & Password
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.privacyUpdate,
              {
                backgroundColor: colors.cardColor,
                borderColor: colors.borderColor,
              },
            ]}
            onPress={() => navigation.navigate('Home', { screen: 'AddPerson' })}
          >
            <MaterialIcons name="people" size={24} color={colors.primary} />
            <Text style={[styles.privacyText, { color: colors.textColor }]}>
              Manage Family Members
            </Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.textColor }]}>
            Location & Notification
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primaryLight }]}
          >
            <Text style={{ color: colors.textColor }}>
              <Ionicons name="location" size={24} color={colors.accent} />{" "}
              Location Sharing
            </Text>
            <Switch
              trackColor={{
                false: colors.switchTrackFalse,
                true: colors.switchTrackTrue,
              }}
              thumbColor={
                isLocationEnabled ? colors.primary : colors.switchThumb
              }
              onValueChange={toggleLocation}
              value={isLocationEnabled}
              style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
            />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.textColor }]}>
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.accent}
            />{" "}
            Notification Preferences
          </Text>

          <TouchableOpacity
            style={[
              styles.blankButton,
              {
                backgroundColor: colors.cardColor,
                borderColor: colors.borderColor,
              },
            ]}
          >
            <Text style={{ color: colors.textColor }}>
              When Person Enters Geofence
            </Text>
            <Switch
              value={geofenceEnter}
              onValueChange={() =>
                handleNotificationToggle(setGeofenceEnter, geofenceEnter)
              }
              trackColor={{
                false: colors.borderColor,
                true: colors.switchTrackTrue,
              }}
              thumbColor={geofenceEnter ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.blankButton,
              {
                backgroundColor: colors.cardColor,
                borderColor: colors.borderColor,
              },
            ]}
          >
            <Text style={{ color: colors.textColor }}>
              When Person Exits Geofence
            </Text>
            <Switch
              value={geofenceExit}
              onValueChange={() =>
                handleNotificationToggle(setGeofenceExit, geofenceExit)
              }
              trackColor={{
                false: colors.borderColor,
                true: colors.switchTrackTrue,
              }}
              thumbColor={geofenceExit ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.textColor }]}>
            <MaterialIcons
              name="family-restroom"
              size={24}
              color={colors.accent}
            />{" "}
            Family Member Changes
          </Text>

          <TouchableOpacity
            style={[
              styles.blankButton,
              {
                backgroundColor: colors.cardColor,
                borderColor: colors.borderColor,
              },
            ]}
          >
            <Text style={{ color: colors.textColor }}>
              When New Person is Added
            </Text>
            <Switch
              value={newPersonAdded}
              onValueChange={() =>
                handleNotificationToggle(setNewPersonAdded, newPersonAdded)
              }
              trackColor={{
                false: colors.borderColor,
                true: colors.switchTrackTrue,
              }}
              thumbColor={
                newPersonAdded ? colors.primary : colors.textSecondary
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.blankButton,
              {
                backgroundColor: colors.cardColor,
                borderColor: colors.borderColor,
              },
            ]}
          >
            <Text style={{ color: colors.textColor }}>
              When Someone Leaves the App
            </Text>
            <Switch
              value={personLeft}
              onValueChange={() =>
                handleNotificationToggle(setPersonLeft, personLeft)
              }
              trackColor={{
                false: colors.borderColor,
                true: colors.switchTrackTrue,
              }}
              thumbColor={personLeft ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.textColor }]}>
            <MaterialIcons name="task" size={24} color={colors.accent} /> Task
            Notifications
          </Text>

          <TouchableOpacity
            style={[
              styles.blankButton,
              {
                backgroundColor: colors.cardColor,
                borderColor: colors.borderColor,
              },
            ]}
          >
            <Text style={{ color: colors.textColor }}>
              When Task is Assigned
            </Text>
            <Switch
              value={taskAssigned}
              onValueChange={() =>
                handleNotificationToggle(setTaskAssigned, taskAssigned)
              }
              trackColor={{
                false: colors.borderColor,
                true: colors.switchTrackTrue,
              }}
              thumbColor={taskAssigned ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.blankButton,
              {
                backgroundColor: colors.cardColor,
                borderColor: colors.borderColor,
              },
            ]}
          >
            <Text style={{ color: colors.textColor }}>
              When Task is Accepted
            </Text>
            <Switch
              value={taskAccepted}
              onValueChange={() =>
                handleNotificationToggle(setTaskAccepted, taskAccepted)
              }
              trackColor={{
                false: colors.borderColor,
                true: colors.switchTrackTrue,
              }}
              thumbColor={taskAccepted ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.blankButton,
              {
                backgroundColor: colors.cardColor,
                borderColor: colors.borderColor,
              },
            ]}
          >
            <Text style={{ color: colors.textColor }}>When Task is Denied</Text>
            <Switch
              value={taskDenied}
              onValueChange={() =>
                handleNotificationToggle(setTaskDenied, taskDenied)
              }
              trackColor={{
                false: colors.borderColor,
                true: colors.switchTrackTrue,
              }}
              thumbColor={taskDenied ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: colors.borderColor }]}
            onPress={() => logout()}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
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
  blankButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
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
