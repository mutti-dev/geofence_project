import React, { useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MainScreen from "../screens/Main/MainScreen";
import TaskScreen from "../screens/Main/TaskScreen";
import AddPersonScreen from "../screens/Main/AddPersonScreen";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { ThemeContext } from "../contexts/ThemeContext";
import { AuthContext } from "../contexts/AuthContext";
import ManageFamilyScreen from "../screens/Main/ManageFamilyScreen";
import GeofenceScreen from "../screens/Main/GeofenceScreen";
import LiveMapScreen from "../screens/Main/LiveMapScreen";
import NotificationScreen from "../screens/Main/NotificationScreen";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { colors } = useContext(ThemeContext) || {};
  const { user } = useContext(AuthContext) || {};

  const activeColor = (colors && colors.accent) || "#008080";
  const inactiveColor = (colors && colors.textSecondary) || "#666";
  const backgroundColor = (colors && colors.surfaceColor) || "#fff";
  const borderColor = (colors && colors.borderColor) || "#eee";

  return (
    <Tab.Navigator
      initialRouteName="Map"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          height: 60,
          paddingBottom: 6,
          backgroundColor,
          borderTopColor: borderColor,
        },
        tabBarIcon: ({ color, size }) => {
          switch (route.name) {
            case "Map":
              return <MaterialIcons name="map" size={size} color={color} />;
            case "Tasks":
              return <Ionicons name="clipboard-outline" size={size} color={color} />;
            case "Geofence":
              return <FontAwesome5 name="map-marker-alt" size={size} color={color} />;
            case "LiveMap":
              return <MaterialIcons name="my-location" size={size} color={color} />;
            case "Notifications":
              return <Ionicons name="notifications-outline" size={size} color={color} />;
            case "AddPerson":
              return <MaterialIcons name="person-add" size={size} color={color} />;
            case "ManageFamily":
              return <Ionicons name="people-outline" size={size} color={color} />;
            default:
              return null;
          }
        },
      })}
    >
      {/* Map Tab (all users) */}
      <Tab.Screen name="Map" component={MainScreen} />

      {/* Tasks Tab (all users) */}
      <Tab.Screen name="Tasks" component={TaskScreen} />

      {/* Geofence (Admin only) */}
      {user?.role === "admin" && (
        <Tab.Screen
          name="Geofence"
          component={GeofenceScreen}
          options={{ title: "Geofences" }}
        />
      )}

      {/* Live Map (all users) */}
      <Tab.Screen
        name="LiveMap"
        component={LiveMapScreen}
        options={{ title: "Live Map" }}
      />

      {/* Notifications (Admin only) */}
      {user?.role === "admin" && (
        <Tab.Screen
          name="Notifications"
          component={NotificationScreen}
          options={{ title: "Notifications" }}
        />
      )}

      {/* Add Person (Admin only) */}
      {user?.role === "admin" && (
        <Tab.Screen
          name="AddPerson"
          component={AddPersonScreen}
          options={{ title: "Add Person" }}
        />
      )}

      {/* Manage Family (all users) */}
      <Tab.Screen
        name="ManageFamily"
        component={ManageFamilyScreen}
        options={{ title: "Family" }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
