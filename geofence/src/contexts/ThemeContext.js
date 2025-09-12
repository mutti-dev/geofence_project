import React, { createContext, useState, useEffect } from "react";
import { Appearance } from "react-native";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemTheme = Appearance.getColorScheme();
  const [currentTheme, setCurrentTheme] = useState(systemTheme || "light");

  // central color generator
  const getThemeColors = (theme) => {
    const isDark = theme === "dark";
    return {
      backgroundColor: isDark ? "#121212" : "#ffffff",
      surfaceColor: isDark ? "#1e1e1e" : "#f8f9fa",
      cardColor: isDark ? "#2c2c2c" : "#ffffff",
      textColor: isDark ? "#ffffff" : "#000000",
      textSecondary: isDark ? "#cccccc" : "#666666",
      primary: "#008080",
      primaryLight: "#39e0e0ff",
      accent: "#FFA500",
      borderColor: isDark ? "#404040" : "#f0f0f0",
      switchTrackFalse: isDark ? "#404040" : "#008080",
      switchTrackTrue: isDark ? "#4DD0E1" : "#efd39eff",
      switchThumb: isDark ? "#4DD0E1" : "#f3f0eaff",
      success: isDark ? "#759116" : "#759116",
      error: isDark ? "#de1a24" : "#de1a24",
    };
  };

  const colors = getThemeColors(currentTheme);

  const toggleTheme = (theme) => {
    if (theme === "system") {
      const sysTheme = Appearance.getColorScheme();
      setCurrentTheme(sysTheme);
    } else {
      setCurrentTheme(theme === "dark" ? "dark" : "light");
    }
  };

  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      if (currentTheme === "system") setCurrentTheme(colorScheme);
    });
    return () => listener.remove();
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
