import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MapScreen from "../screens/Main/MapScreen";
import TaskScreen from "../screens/Main/TaskScreen";
import AddPersonScreen from "../screens/Main/AddPersonScreen";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../contexts/ThemeContext";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { currentTheme } = React.useContext(ThemeContext);
  const colors = currentTheme === "dark" ? { background: "#121212", text: "#fff" } : { background: "#fff", text: "#000" };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: "#008080",
        tabBarInactiveTintColor: "#999",
      }}
    >
      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} /> }} 
      />
      <Tab.Screen 
        name="Task" 
        component={TaskScreen} 
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="checkbox" size={size} color={color} /> }} 
      />
      <Tab.Screen 
        name="AddPerson" 
        component={AddPersonScreen} 
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person-add" size={size} color={color} /> }} 
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
