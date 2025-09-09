import React, { useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MapScreen from "../screens/Main/MapScreen";
import TaskScreen from "../screens/Main/TaskScreen";
// import GeofenceScreen from "../screens/Main/GeofenceScreen";
import AddPersonScreen from "../screens/Main/AddPersonScreen";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { ThemeContext } from "../contexts/ThemeContext";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { colors } = useContext(ThemeContext) || {};
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
          if (route.name === "Geofence")
            return (
              <FontAwesome5 name="map-marker-alt" size={size} color={color} />
            );
          if (route.name === "AddPerson")
            return (
              <MaterialIcons name="person-add" size={size} color={color} />
            );
          return null;
        },
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Tasks" component={TaskScreen} />
      {/* <Tab.Screen name="Geofence" component={GeofenceScreen} /> */}
      <Tab.Screen
        name="AddPerson"
        component={AddPersonScreen}
        options={{ title: "Add Person" }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
