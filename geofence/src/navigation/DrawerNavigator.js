import React, { useContext } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import TabNavigator from "./TabNavigator";
import { ThemeContext } from "../contexts/ThemeContext";
import { View, Text } from "react-native";

let ProfileScreen;
let SettingsScreen;
let EditProfileScreen;
let ChangeCredentialsScreen;
let ManageFamilyScreen;
try {
  ProfileScreen =
    require("../screens/Settings/ProfileScreen").default ||
    require("../screens/Settings/ProfileScreen");
} catch (e) {
  ProfileScreen = null;
}
try {
  SettingsScreen =
    require("../screens/Settings/SettingsScreen").default ||
    require("../screens/Settings/SettingsScreen");
} catch (e) {
  SettingsScreen = null;
}
try {
  EditProfileScreen =
    require("../screens/Settings/EditProfileScreen").default ||
    require("../screens/Settings/EditProfileScreen");
} catch (e) {
  EditProfileScreen = null;
}
try {
  ChangeCredentialsScreen =
    require("../screens/Settings/ChangeCredentialsScreen").default ||
    require("../screens/Settings/ChangeCredentialsScreen");
} catch (e) {
  ChangeCredentialsScreen = null;
}
try {
  ManageFamilyScreen =
    require("../screens/Settings/ManageFamilyScreen").default ||
    require("../screens/Settings/ManageFamilyScreen");
} catch (e) {
  ManageFamilyScreen = null;
}

const Drawer = createDrawerNavigator();

const MissingScreen = ({ name }) => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text>{name} screen not found</Text>
  </View>
);

const DrawerNavigator = () => {
  const { colors } = useContext(ThemeContext) || {};

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: colors?.background },
        drawerActiveTintColor: colors?.primary || "#008080",
        drawerInactiveTintColor: colors?.text || "#000",
      }}
    >
      <Drawer.Screen name="Home" component={TabNavigator} />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen || (() => <MissingScreen name="Profile" />)}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen || (() => <MissingScreen name="Settings" />)}
      />
      {/* hidden/detail screens available in navigation stack */}
      {EditProfileScreen && (
        <Drawer.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ drawerItemStyle: { height: 0 } }}
        />
      )}
      {ChangeCredentialsScreen && (
        <Drawer.Screen
          name="ChangeCredentials"
          component={ChangeCredentialsScreen}
          options={{ drawerItemStyle: { height: 0 } }}
        />
      )}
      {ManageFamilyScreen && (
        <Drawer.Screen
          name="ManageFamily"
          component={ManageFamilyScreen}
          options={{ drawerItemStyle: { height: 0 } }}
        />
      )}
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
