// App.js
import React from "react";
import { ThemeProvider } from "./src/contexts/ThemeContext";
import { AuthProvider } from "./src/contexts/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { SocketProvider } from "./src/contexts/SocketContext";
import AppProviders from "./src/providers/AppProviders";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <AppProviders>
            <AppNavigator />
          </AppProviders>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
