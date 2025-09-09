import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import DrawerNavigator from "./DrawerNavigator";
import { AuthContext } from "../contexts/AuthContext";
import AddPersonScreen from "../screens/Main/AddPersonScreen";
import AddSafeZoneScreen from "../screens/Main/AddSafeZoneScreen";
import ViewSafeZoneScreen from "../screens/Main/ViewSafeZoneScreen";
import MapScreen from "../screens/Main/MapScreen";


const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user } = useContext(AuthContext);

  return (
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
        <Stack.Screen name="AddSafeZoneScreen" component={AddSafeZoneScreen} />
        <Stack.Screen name="MapScreen" component={MapScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
