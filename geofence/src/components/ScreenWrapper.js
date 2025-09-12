// components/ScreenWrapper.js
import React from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ScreenWrapper = ({ children }) => {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      
        {children}
      
    </SafeAreaView>
  );
};

export default ScreenWrapper;
