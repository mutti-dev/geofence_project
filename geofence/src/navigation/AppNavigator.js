// navigation/AppNavigator.js
import React, { useContext, useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Image, StyleSheet } from "react-native";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import DrawerNavigator from "./DrawerNavigator";
import { AuthContext } from "../contexts/AuthContext";
import AddPersonScreen from "../screens/Main/AddPersonScreen";
import AddSafeZoneScreen from "../screens/Main/AddSafeZoneScreen";
import ViewSafeZoneScreen from "../screens/Main/ViewSafeZoneScreen";
import MapScreen from "../screens/Main/MapScreen";
import AssignTaskScreen from "../screens/Main/AssignTaskScreen";
import ScreenWrapper from "../components/ScreenWrapper";

const Stack = createNativeStackNavigator();

// SplashScreen Component
const SplashScreen = () => {
  return (
    <View style={styles.splashContainer}>
      <Image
        source={require("../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const AppNavigator = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate splash screen delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500); // 2.5 seconds
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <ScreenWrapper>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="Drawer" component={DrawerNavigator} />
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}

          <Stack.Screen name="ViewSafeZone" component={ViewSafeZoneScreen} />
          <Stack.Screen
            name="AddSafeZoneScreen"
            component={AddSafeZoneScreen}
          />
          <Stack.Screen name="MapScreen" component={MapScreen} />
          <Stack.Screen name="AssignTask" component={AssignTaskScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ScreenWrapper>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#fff", // background color of splash
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 200,
    height: 200,
  },
});
