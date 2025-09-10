import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerApi, loginApi } from "../api/authApi";
import { registerForPushNotificationsAsync } from "../utils/notificationHelper";


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const register = async ({
    name,
    email,
    password,
    role,
    circleName,
    inviteCode,
  }) => {
    try {
      const res = await registerApi(
        name,
        email,
        password,
        role,
        circleName,
        inviteCode
      );
      if (res.token) {
        await AsyncStorage.setItem("token", res.token);
        setUser(res);
        // navigate to main app handled by consumer based on user state
      }
      return res;
    } catch (err) {
      console.log("Register error", err.response?.data || err.message);
      throw err;
    }
  };

  const login = async (email, password) => {
    const res = await loginApi(email, password);
    if (res.token) {
      await AsyncStorage.setItem("user", JSON.stringify(res));
      setUser(res);
      registerForPushNotificationsAsync();
    }
    return res;
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    setUser(null);
  };

  const loadUser = async () => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      setUser({ token }); // optionally fetch full profile
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, register, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
