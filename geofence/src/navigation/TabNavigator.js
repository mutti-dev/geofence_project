import React, { useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MainScreen from "../screens/Main/MainScreen"; // Map screen
import TaskScreen from "../screens/Main/TaskScreen";
import AddPersonScreen from "../screens/Main/AddPersonScreen";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { ThemeContext } from "../contexts/ThemeContext";
import { AuthContext } from "../contexts/AuthContext";
import ManageFamilyScreen from "../screens/Main/ManageFamilyScreen";
import GeofenceScreen from "../screens/Main/GeofenceScreen";
import GeofenceManagementScreen from "../screens/Main/GeofenceManagementScreen";
import LiveMapScreen from "../screens/Main/LiveMapScreen";
import NotificationScreen from "../screens/Main/NotificationScreen";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { colors } = useContext(ThemeContext) || {};
  const { user } = useContext(AuthContext) || {};
  const activeColor = (colors && colors.primary) || "#008080";
  const inactiveColor = (colors && colors.accent) || "#ff7f50";

  return (
    <Tab.Navigator
      initialRouteName="Map"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: { height: 60, paddingBottom: 6 },
        tabBarIcon: ({ color, size }) => {
          if (route.name === "Map")
            return <MaterialIcons name="map" size={size} color={color} />;
          if (route.name === "Tasks")
            return (
              <Ionicons name="clipboard-outline" size={size} color={color} />
            );
          if (route.name === "GeofenceManagement")
            return (
              <FontAwesome5 name="draw-polygon" size={size} color={color} />
            );
          if (route.name === "Geofence")
            return (
              <FontAwesome5 name="map-marker-alt" size={size} color={color} />
            );
          if (route.name === "LiveMap")
            return (
              <MaterialIcons name="my-location" size={size} color={color} />
            );
          if (route.name === "Notifications")
            return (
              <Ionicons
                name="notifications-outline"
                size={size}
                color={color}
              />
            );
          if (route.name === "AddPerson")
            return (
              <MaterialIcons name="person-add" size={size} color={color} />
            );
          if (route.name === "ManageFamily")
            return <Ionicons name="people-outline" size={size} color={color} />;
          return null;
        },
      })}
    >
      {/* Map Tab */}
      <Tab.Screen name="Map" component={MainScreen} />

      {/* Tasks Tab */}
      <Tab.Screen name="Tasks" component={TaskScreen} />

      {/* Geofence/Geofence Management Tab */}
      {user?.role === "admin" && (
        <Tab.Screen
          name="Geofence"
          component={GeofenceScreen}
          options={{ title: "Geofences" }}
        />
      )}

      {/* Live Map Tab (all users) */}
      <Tab.Screen
        name="LiveMap"
        component={LiveMapScreen}
        options={{ title: "Live Map" }}
      />

      {/* Notifications Tab (all users) */}
      {user.role === "admin" && (
        <Tab.Screen
          name="Notifications"
          component={NotificationScreen}
          options={{ title: "Notifications" }}
        />
      )}

      {/* Add Person (Admin Only) */}
      {user?.role === "admin" && (
        <Tab.Screen
          name="AddPerson"
          component={AddPersonScreen}
          options={{ title: "Add Person" }}
        />
      )}

      {/* Manage Family */}
      <Tab.Screen
        name="ManageFamily"
        component={ManageFamilyScreen}
        options={{ title: "Family" }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
