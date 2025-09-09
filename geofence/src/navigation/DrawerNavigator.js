import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import TabNavigator from "./TabNavigator";
import SettingsScreen from "../screens/Settings/SettingsScreen";
import { ThemeContext } from "../contexts/ThemeContext";

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  const { currentTheme } = React.useContext(ThemeContext);
  const colors = currentTheme === "dark" ? { background: "#121212", text: "#fff" } : { background: "#fff", text: "#000" };

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: colors.background },
        drawerActiveTintColor: "#008080",
        drawerInactiveTintColor: colors.text,
      }}
    >
      <Drawer.Screen name="Home" component={TabNavigator} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
