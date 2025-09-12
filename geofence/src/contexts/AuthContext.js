import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerApi, loginApi } from "../api/authApi";



export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  console.log("user", user);
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
      await AsyncStorage.setItem("token", res.token);
      await AsyncStorage.setItem("user", JSON.stringify(res));
      setUser(res);

    }
    return res;
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setUser(null);
  };

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userData = await AsyncStorage.getItem("user");
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else if (token) {
        // If we have token but no user data, set minimal user object
        setUser({ token });
      }
    } catch (error) {
      console.log("Error loading user:", error);
      // Clear corrupted data
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, register, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
